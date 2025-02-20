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

//! Methods for the `list` type.

use crate::{
    self as starlark,
    environment::GlobalsBuilder,
    stdlib::util::{convert_index, convert_indices},
    values::{
        list::List,
        none::{NoneOr, NoneType},
        Value, ValueError,
    },
};
use anyhow::anyhow;
use gazebo::cell::ARef;

#[starlark_module]
pub(crate) fn list_methods(builder: &mut GlobalsBuilder) {
    /// [list.append](
    /// https://github.com/google/skylark/blob/3705afa472e466b8b061cce44b47c9ddc6db696d/doc/spec.md#list·append
    /// ): append an element to a list.
    ///
    /// `L.append(x)` appends `x` to the list L, and returns `None`.
    ///
    /// `append` fails if the list is frozen or has active iterators.
    ///
    /// Examples:
    ///
    /// ```
    /// # starlark::assert::is_true(r#"
    /// x = []
    /// x.append(1)
    /// x.append(2)
    /// x.append(3)
    /// x == [1, 2, 3]
    /// # "#);
    /// ```
    fn append(this: Value, ref el: Value) -> NoneType {
        let mut this = List::from_value_mut(this)?.unwrap();
        this.content.push(el);
        Ok(NoneType)
    }

    /// [list.clear](
    /// https://github.com/google/skylark/blob/3705afa472e466b8b061cce44b47c9ddc6db696d/doc/spec.md#list·clear
    /// ): clear a list
    ///
    /// `L.clear()` removes all the elements of the list L and returns `None`.
    /// It fails if the list is frozen or if there are active iterators.
    ///
    /// Examples:
    ///
    /// ```
    /// # starlark::assert::is_true(r#"
    /// x = [1, 2, 3]
    /// x.clear()
    /// x == []
    /// # "#);
    /// ```
    fn clear(this: Value) -> NoneType {
        let mut this = List::from_value_mut(this)?.unwrap();
        this.content.clear();
        Ok(NoneType)
    }

    /// [list.extend](
    /// https://github.com/google/skylark/blob/3705afa472e466b8b061cce44b47c9ddc6db696d/doc/spec.md#list·extend
    /// ): extend a list with another iterable's content.
    ///
    /// `L.extend(x)` appends the elements of `x`, which must be iterable, to
    /// the list L, and returns `None`.
    ///
    /// `extend` fails if `x` is not iterable, or if the list L is frozen or has
    /// active iterators.
    ///
    /// Examples:
    ///
    /// ```
    /// # starlark::assert::is_true(r#"
    /// x = []
    /// x.extend([1, 2, 3])
    /// x.extend(["foo"])
    /// x == [1, 2, 3, "foo"]
    /// # "#);
    /// ```
    fn extend(this: Value, ref other: Value) -> NoneType {
        let mut res = List::from_value_mut(this)?.unwrap();
        if this.ptr_eq(other) {
            // If the types alias, we can't borrow the `other` for iteration.
            // But we can do something smarter to double the elements
            res.content.extend_from_within(..);
        } else {
            other.with_iterator(heap, |it| {
                res.content.extend(it);
            })?;
        }
        Ok(NoneType)
    }

    /// [list.index](
    /// https://github.com/google/skylark/blob/3705afa472e466b8b061cce44b47c9ddc6db696d/doc/spec.md#list·index
    /// ): get the index of an element in the list.
    ///
    /// `L.index(x[, start[, end]])` finds `x` within the list L and returns its
    /// index.
    ///
    /// The optional `start` and `end` parameters restrict the portion of
    /// list L that is inspected.  If provided and not `None`, they must be list
    /// indices of type `int`. If an index is negative, `len(L)` is effectively
    /// added to it, then if the index is outside the range `[0:len(L)]`, the
    /// nearest value within that range is used; see [Indexing](#indexing).
    ///
    /// `index` fails if `x` is not found in L, or if `start` or `end`
    /// is not a valid index (`int` or `None`).
    ///
    /// Examples:
    ///
    /// ```
    /// # starlark::assert::is_true(r#"
    /// x = ["b", "a", "n", "a", "n", "a"]
    /// # (
    /// x.index("a") == 1      # bAnana
    /// # and
    /// x.index("a", 2) == 3   # banAna
    /// # and
    /// x.index("a", -2) == 5  # bananA
    /// # )"#);
    /// ```
    fn index(
        this: ARef<List>,
        ref needle: Value,
        ref start @ NoneOr::None: NoneOr<i32>,
        ref end @ NoneOr::None: NoneOr<i32>,
    ) -> i32 {
        let (start, end) = convert_indices(this.content.len() as i32, start, end);
        for (i, x) in this.content[start..end].iter().enumerate() {
            if x.equals(needle)? {
                return Ok((i + start) as i32);
            }
        }
        Err(anyhow!(
            "Element '{}' not found in '{}'",
            needle,
            this.to_repr()
        ))
    }

    /// [list.insert](
    /// https://github.com/google/skylark/blob/3705afa472e466b8b061cce44b47c9ddc6db696d/doc/spec.md#list·insert
    /// ): insert an element in a list.
    ///
    /// `L.insert(i, x)` inserts the value `x` in the list L at index `i`,
    /// moving higher-numbered elements along by one.  It returns `None`.
    ///
    /// As usual, the index `i` must be an `int`. If its value is negative,
    /// the length of the list is added, then its value is clamped to the
    /// nearest value in the range `[0:len(L)]` to yield the effective index.
    ///
    /// `insert` fails if the list is frozen or has active iterators.
    ///
    /// Examples:
    ///
    /// ```
    /// # starlark::assert::is_true(r#"
    /// x = ["b", "c", "e"]
    /// x.insert(0, "a")
    /// x.insert(-1, "d")
    /// x == ["a", "b", "c", "d", "e"]
    /// # "#);
    /// ```
    fn insert(this: Value, ref index: i32, ref el: Value) -> NoneType {
        let mut this = List::from_value_mut(this)?.unwrap();
        let index = convert_index(this.len() as i32, index);
        this.content.insert(index, el);
        Ok(NoneType)
    }

    /// [list.pop](
    /// https://github.com/google/skylark/blob/3705afa472e466b8b061cce44b47c9ddc6db696d/doc/spec.md#list·pop
    /// ): removes and returns the last element of a list.
    ///
    /// `L.pop([index])` removes and returns the last element of the list L, or,
    /// if the optional index is provided, at that index.
    ///
    /// `pop` fails if the index is negative or not less than the length of
    /// the list, of if the list is frozen or has active iterators.
    ///
    /// Examples:
    ///
    /// ```
    /// # starlark::assert::is_true(r#"
    /// x = [1, 2, 3]
    /// # (
    /// x.pop() == 3
    /// # and
    /// x.pop() == 2
    /// # and
    /// x == [1]
    /// # )"#);
    /// ```
    fn pop(this: Value, ref index: Option<Value>) -> Value<'v> {
        let index = match index {
            Some(index) => Some(index.to_int()?),
            None => None,
        };

        let mut this = List::from_value_mut(this)?.unwrap();
        let index = index.unwrap_or_else(|| (this.len() as i32) - 1);
        if index < 0 || index >= this.len() as i32 {
            return Err(ValueError::IndexOutOfBound(index).into());
        }
        Ok(this.content.remove(index as usize))
    }

    /// [list.remove](
    /// https://github.com/google/skylark/blob/3705afa472e466b8b061cce44b47c9ddc6db696d/doc/spec.md#list·remove
    /// ): remove a value from a list
    ///
    /// `L.remove(x)` removes the first occurrence of the value `x` from the
    /// list L, and returns `None`.
    ///
    /// `remove` fails if the list does not contain `x`, is frozen, or has
    /// active iterators.
    ///
    /// Examples:
    ///
    /// ```
    /// # starlark::assert::is_true(r#"
    /// x = [1, 2, 3, 2]
    /// x.remove(2)
    /// # t = (
    /// x == [1, 3, 2]
    /// # )
    /// x.remove(2)
    /// # (t and (
    /// x == [1, 3]
    /// # ))"#);
    /// ```
    ///
    /// A subsequent call to `x.remove(2)` would yield an error because the
    /// element won't be found.
    ///
    /// ```
    /// # starlark::assert::fail(r#"
    /// x = [1, 2, 3, 2]
    /// x.remove(2)
    /// x.remove(2)
    /// x.remove(2) # error: not found
    /// # "#, "not found");
    /// ```
    fn remove(this: Value, ref needle: Value) -> NoneType {
        // Written in two separate blocks so we ensure we give up the
        // immutable borrow before making the mutable borrow.
        let position = {
            let this = List::from_value(this).unwrap();
            match this.content.iter().position(|v| *v == needle) {
                Some(i) => i,
                None => {
                    return Err(anyhow!(
                        "Element '{}' not found in list '{}'",
                        needle,
                        this.to_repr()
                    ));
                }
            }
        };
        {
            // now mutate it with no further value calls
            let mut this = List::from_value_mut(this)?.unwrap();
            this.content.remove(position);
            Ok(NoneType)
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::assert;

    #[test]
    fn test_error_codes() {
        assert::fail(
            "x = [1, 2, 3, 2]; x.remove(2); x.remove(2); x.remove(2)",
            "not found in list",
        );
    }

    #[test]
    fn recursive_list() {
        assert::is_true(
            r#"
cyclic = [1, 2, 3]
cyclic[1] = cyclic
len(cyclic) == 3 and len(cyclic[1]) == 3
    "#,
        )
    }
}
