/*
 * Copyright 2018 The Starlark in Rust Authors.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//! The environment, called "Module" in [this spec](
//! https://github.com/google/skylark/blob/a0e5de7e63b47e716cca7226662a4c95d47bf873/doc/spec.md)
//! is the list of variable in the current scope. It can be frozen, after which
//! all values from this environment become immutable.

use crate::{
    environment::{
        names::{FrozenNames, MutableNames},
        slots::{FrozenSlots, ModuleSlotId, MutableSlots},
        EnvironmentError,
    },
    errors::did_you_mean::did_you_mean,
    syntax::ast::Visibility,
    values::{
        docs,
        docs::{DocItem, DocString},
        Freezer, FrozenHeap, FrozenHeapRef, FrozenValue, Heap, OwnedFrozenValue, SimpleValue,
        StarlarkValue, Value, ValueLike,
    },
};
use gazebo::{any::AnyLifetime, prelude::*};
use itertools::Itertools;
use std::{cell::RefCell, collections::HashMap, mem, sync::Arc};

/// The result of freezing a [`Module`], making it and its contained values immutable.
///
/// The values of this [`FrozenModule`] are stored on a frozen heap, a reference to which
/// can be obtained using [`frozen_heap`](FrozenModule::frozen_heap). Be careful not to use
/// these values after the [`FrozenModule`] has been released unless you obtain a reference
/// to the frozen heap.
#[derive(Debug, Clone, Dupe)]
// We store the two elements separately since the FrozenHeapRef contains
// a copy of the FrozenModuleData inside it.
// Two Arc's should still be plenty cheap enough to qualify for `Dupe`.
pub struct FrozenModule(FrozenHeapRef, FrozenModuleRef);

#[derive(Debug, Clone, Dupe, AnyLifetime)]
pub(crate) struct FrozenModuleRef(pub(crate) Arc<FrozenModuleData>);

#[derive(Debug)]
pub(crate) struct FrozenModuleData {
    pub(crate) names: FrozenNames,
    pub(crate) slots: FrozenSlots,
    docstring: Option<String>,
}

// When a definition is frozen, it still needs to get at some module info,
// specifically the slots (for execution) and the names (for debugging).
// Since the module slots also reference the definitions, they can't use a
// normal Arc since otherwise we'll have a loop and never collect a module.
// Solution is to put the slots in the heap, as a `FrozenValue`, then
// we wrap a `FrozenModuleValue` around it to give some type safety and a place
// to put the APIs.
#[derive(Clone, Dupe, Copy)]
// Deliberately don't derive Debug, since this value often occurs in cycles,
// and Debug printing of that would be bad.
pub(crate) struct FrozenModuleValue(FrozenValue); // Must contain a FrozenModuleRef inside it

/// Container for the documentation for a module
#[derive(Clone, Debug, PartialEq)]
pub struct ModuleDocs {
    /// The documentation for the module itself
    pub module: Option<DocItem>,
    /// A mapping of top level symbols to their documentation, if any.
    pub members: HashMap<String, Option<DocItem>>,
}

/// A container for user values, used during execution.
///
/// A module contains both a [`FrozenHeap`] and [`Heap`] on which different values are allocated.
/// You can get references to these heaps with [`frozen_heap`](Module::frozen_heap) and
/// [`heap`](Module::heap). Be careful not to use these values after the [`Module`] has been
/// released unless you obtain a reference to the frozen heap.
#[derive(Debug)]
pub struct Module {
    heap: Heap,
    frozen_heap: FrozenHeap,
    names: MutableNames,
    // Should really be MutableSlots<'v>, where &'v self
    // Values are allocated from heap. Because of variance
    // you can inject the wrong values in, so make sure slots aren't
    // exported.
    slots: MutableSlots<'static>,
    docstring: RefCell<Option<String>>,
}

impl FrozenModule {
    /// Get value, exported or private by name.
    #[doc(hidden)] // TODO(nga): Buck2 depends on this function
    pub fn get_any_visibility(&self, name: &str) -> Option<(OwnedFrozenValue, Visibility)> {
        let (slot, vis) = self.1.0.names.get_name(name)?;
        // This code is safe because we know the frozen module ref keeps the values alive
        self.1
            .0
            .slots
            .get_slot(slot)
            .map(|x| (unsafe { OwnedFrozenValue::new(self.0.dupe(), x) }, vis))
    }

    /// Get the value of the exported variable `name`.
    /// Returns [`None`] if the variable isn't defined in the module or it is private.
    pub fn get(&self, name: &str) -> Option<OwnedFrozenValue> {
        self.get_any_visibility(name)
            .and_then(|(value, vis)| match vis {
                Visibility::Private => None,
                Visibility::Public => Some(value),
            })
    }

    /// Iterate through all the names defined in this module.
    pub fn names(&self) -> impl Iterator<Item = &str> {
        self.1.0.names()
    }

    /// Obtain the [`FrozenHeapRef`] which owns the storage of all values defined in this module.
    pub fn frozen_heap(&self) -> &FrozenHeapRef {
        &self.0
    }

    /// Print out some approximation of the module definitions.
    pub fn describe(&self) -> String {
        self.1.0.describe()
    }

    pub fn documentation(&self) -> Option<DocItem> {
        self.1.documentation()
    }

    /// The documentation for the module, and all of its top level values
    ///
    /// Returns (<module documentation>, { <symbol> : <that symbol's documentation> })
    pub fn module_documentation(&self) -> ModuleDocs {
        let members = self
            .names()
            .filter(|n| Module::default_visibility(n) == Visibility::Public)
            .filter_map(|n| {
                self.get(n)
                    .map(|fv| (n.to_owned(), fv.value().get_ref().documentation()))
            })
            .collect();

        ModuleDocs {
            module: self.documentation(),
            members,
        }
    }
}

impl FrozenModuleData {
    pub fn names(&self) -> impl Iterator<Item = &str> {
        self.names.symbols().map(|x| x.0.as_str())
    }

    pub fn describe(&self) -> String {
        self.names
            .symbols()
            .filter_map(|(name, slot)| Some((name, self.slots.get_slot(slot)?)))
            .map(|(name, val)| val.to_value().describe(name))
            .join("\n")
    }

    pub(crate) fn get_slot(&self, slot: ModuleSlotId) -> Option<FrozenValue> {
        self.slots.get_slot(slot)
    }

    /// Try and go back from a slot to a name.
    /// Inefficient - only use in error paths.
    pub(crate) fn get_slot_name(&self, slot: ModuleSlotId) -> Option<String> {
        for (s, i) in self.names.symbols() {
            if i == slot {
                return Some(s.clone());
            }
        }
        None
    }
}

impl<'v> StarlarkValue<'v> for FrozenModuleRef {
    starlark_type!("frozen_module");

    fn documentation(&self) -> Option<DocItem> {
        self.0.docstring.as_ref().map(|d| {
            DocItem::Module(docs::Module {
                docs: DocString::from_docstring(d),
            })
        })
    }
}

impl SimpleValue for FrozenModuleRef {}

impl FrozenModuleValue {
    pub fn new(freezer: &Freezer) -> Self {
        Self(freezer.get_magic())
    }

    pub fn set(freezer: &mut Freezer, val: &FrozenModuleRef) {
        freezer.set_magic(val.dupe())
    }

    pub fn get<'v>(self) -> &'v FrozenModuleData {
        &self.0.downcast_ref::<FrozenModuleRef>().unwrap().0
    }
}

impl Default for Module {
    fn default() -> Self {
        Self::new()
    }
}

impl Module {
    /// Create a new module environment with no contents.
    pub fn new() -> Self {
        Self {
            heap: Heap::new(),
            frozen_heap: FrozenHeap::new(),
            names: MutableNames::new(),
            slots: MutableSlots::new(),
            docstring: RefCell::new(None),
        }
    }

    /// Get the heap on which values are allocated by this module.
    pub fn heap(&self) -> &Heap {
        &self.heap
    }

    /// Get the frozen heap on which frozen values are allocated by this module.
    pub fn frozen_heap(&self) -> &FrozenHeap {
        &self.frozen_heap
    }

    pub(crate) fn names(&self) -> &MutableNames {
        &self.names
    }

    pub(crate) fn slots<'v>(&'v self) -> &'v MutableSlots<'v> {
        // Not true because of variance, but mostly true. Don't export further.
        unsafe { transmute!(&'v MutableSlots<'static>, &'v MutableSlots<'v>, &self.slots) }
    }

    /// Get value, exported or private by name.
    pub(crate) fn get_any_visibility<'v>(&'v self, name: &str) -> Option<(Value<'v>, Visibility)> {
        let (slot, vis) = self.names.get_name(name)?;
        let value = self.slots().get_slot(slot)?;
        Some((value, vis))
    }

    /// Get the value of the exported variable `name`.
    /// Returns [`None`] if the variable isn't defined in the module or it is private.
    pub fn get<'v>(&'v self, name: &str) -> Option<Value<'v>> {
        self.get_any_visibility(name)
            .and_then(|(v, vis)| match vis {
                Visibility::Private => None,
                Visibility::Public => Some(v),
            })
    }

    /// Freeze the environment, all its value will become immutable afterwards.
    pub fn freeze(self) -> anyhow::Result<FrozenModule> {
        let Module {
            names,
            slots,
            frozen_heap,
            heap,
            docstring,
        } = self;
        // This is when we do the GC/freeze, using the module slots as roots
        // Note that we even freeze anonymous slots, since they are accessed by
        // slot-index in the code, and we don't walk into them, so don't know if
        // they are used.
        let mut freezer = Freezer::new::<FrozenModuleRef>(frozen_heap);
        let slots = slots.freeze(&freezer)?;
        let rest = FrozenModuleRef(Arc::new(FrozenModuleData {
            names: names.freeze(),
            slots,
            docstring: docstring.into_inner(),
        }));
        FrozenModuleValue::set(&mut freezer, &rest);
        // The values MUST be alive up until this point (as the above line uses them),
        // but can now be dropped
        mem::drop(heap);

        Ok(FrozenModule(freezer.into_ref(), rest))
    }

    /// Set the value of a variable in the environment.
    /// Modifying these variables while executing is ongoing can have
    /// surprising effects.
    pub fn set<'v>(&'v self, name: &str, value: Value<'v>) {
        let slot = self.names.add_name(name);
        let slots = self.slots();
        slots.ensure_slot(slot);
        slots.set_slot(slot, value);
    }

    /// Symbols starting with underscore are considered private.
    pub(crate) fn default_visibility(symbol: &str) -> Visibility {
        match symbol.starts_with('_') {
            true => Visibility::Private,
            false => Visibility::Public,
        }
    }

    /// Set the value of a variable in the environment. Set its visibliity to
    /// "private" to ensure that it is not re-exported
    pub(crate) fn set_private<'v>(&'v self, name: &str, value: Value<'v>) {
        let slot = self.names.add_name_visibility(name, Visibility::Private);
        let slots = self.slots();
        slots.ensure_slot(slot);
        slots.set_slot(slot, value);
    }

    /// Import symbols from a module, similar to what is done during `load()`.
    pub fn import_public_symbols(&self, module: &FrozenModule) {
        self.frozen_heap.add_reference(&module.0);
        for (k, slot) in module.1.0.names.symbols() {
            if Self::default_visibility(k) == Visibility::Public {
                if let Some(value) = module.1.0.slots.get_slot(slot) {
                    self.set_private(k, Value::new_frozen(value))
                }
            }
        }
    }

    pub(crate) fn load_symbol<'v>(
        &'v self,
        module: &FrozenModule,
        symbol: &str,
    ) -> anyhow::Result<Value<'v>> {
        if Self::default_visibility(symbol) != Visibility::Public {
            return Err(EnvironmentError::CannotImportPrivateSymbol(symbol.to_owned()).into());
        }
        match module.get_any_visibility(symbol) {
            None => Err({
                match did_you_mean(symbol, module.names()) {
                    Some(better) => EnvironmentError::ModuleHasNoSymbolDidYouMean(
                        symbol.to_owned(),
                        better.to_owned(),
                    )
                    .into(),
                    None => EnvironmentError::ModuleHasNoSymbol(symbol.to_owned()).into(),
                }
            }),
            Some((v, Visibility::Public)) => Ok(v.owned_value(self.frozen_heap())),
            Some((_, Visibility::Private)) => {
                Err(EnvironmentError::ModuleSymbolIsNotExported(symbol.to_owned()).into())
            }
        }
    }

    pub(crate) fn set_docstring(&self, docstring: String) {
        self.docstring.replace(Some(docstring));
    }
}

#[test]
fn test_send_sync()
where
    FrozenModule: Send + Sync,
{
}
