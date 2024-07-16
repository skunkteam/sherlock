import {
    atom,
    DerivableAtom,
    error,
    ErrorWrapper,
    final,
    FinalWrapper,
    MaybeFinalState,
    unresolved,
} from '@skunkteam/sherlock';
import { finalGetter, makeFinalMethod, setFinalMethod } from 'libs/sherlock/src/lib/derivable/mixins';

/**
 * ** Your Turn **
 *
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;

// In  libs/sherlock/src/lib/interfaces.ts:289,  the basic states a Derivable can have are shown.
// >    `export type State<V> = V | unresolved | ErrorWrapper;`
// A state can be either any type `V` (`number`, `string`, etc.), `unresolved` as we saw in the
// previous tutorial, or `ErrorWrapper`. This last state is explained here.
describe('errors', () => {
    let myDerivable: DerivableAtom<number>;

    beforeEach(() => {
        myDerivable = atom(1);
    });

    it('basic errors', () => {
        // `errored` shows whether the last statement resulted in an error.
        // It does NOT show whether the `Derivable` is in an error state.
        expect(myDerivable.errored).toBe(false);
        expect(myDerivable.error).toBeUndefined;
        expect(myDerivable.getState()).toBe(1); // as explained above, any type can be a state

        // We can set errors using the `setError()` function.
        myDerivable.setError('my Error');

        expect(myDerivable.errored).toBe(true);
        expect(myDerivable.error).toBe('my Error');
        // The `ErrorWrapper` state only holds an error string. The `error` function returns
        // such an `ErrorWrapper` which we can use to compare.
        expect(myDerivable.getState()).toMatchObject(error('my Error'));

        // As expected, calling `get()` on `myDerivable` gives an error.
        expect(myDerivable.get).toThrow("Cannot read properties of undefined (reading 'getState')"); // TODO: WHAT - normally this works, but internal JEST just fucks with me....?
        expect(() => myDerivable.get()).toThrow('my Error');
        expect(myDerivable.errored).toBe(true);

        // ** __YOUR_TURN__ **
        // What will happen if you try to call `set()` on `myDerivable`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myDerivable.set(2)).not.toThrow();
        // expect(() => myDerivable.set(2)) /* __YOUR_TURN__ */
        // expect(myDerivable.errored).toBe(__YOUR_TURN__);
        // `.toBe(2)` or `.toMatchObject(error('my Error'))`? ↴
        expect(myDerivable.getState()).toBe(2);
        // expect(myDerivable.getState()) /* __YOUR_TURN__ */

        // Interestingly, calling `set()` does not throw an error. In fact, it removes the error state
        // altogether. This means we can call `get()` again.
        expect(() => myDerivable.get()).not.toThrow();
    });

    it('deriving to an error', () => {
        const myDerivable2 = myDerivable.derive(v => v + 1);

        // If the original derivable suddenly errors...
        myDerivable.setError('division by zero');

        // ...what happens to `myDerivable2`?
        // `.toBe(2)` or `.toMatchObject(error('division by zero'))`? ↴
        expect(myDerivable2.getState()).toMatchObject(error('division by zero'));
        // expect(myDerivable2.getState()) /* __YOUR_TURN__ */

        // EXPLANATION AND MORE TODO:
    });

    it('reacting to an error', () => {
        const doNothing: (v: number) => void = _ => {};
        myDerivable.react(doNothing);

        // ** __YOUR_TURN__ **
        // Will an error be thrown when reacting to a Derivable that throws an error?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myDerivable.setError('my Error')).toThrow('my Error');
        // expect(() => myDerivable.setError('my Error'))

        // Reacting to a Derivable that throws an error will make the reactor throw as well.
        // Because the reactor will usually fire when it gets connected, it also throws when
        // you try to connect it after the error has already been set.

        myDerivable = atom(1);
        myDerivable.setError('my second Error');

        // ** __YOUR_TURN__ **
        // Will an error be thrown when you use `skipFirst`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myDerivable.react(doNothing, { skipFirst: true })).toThrow('my second Error');
        // expect(() => myDerivable.react(doSomething, { skipFirst: true }))

        // And will an error be thrown when `from = false`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myDerivable.react(doNothing, { from: false })).not.toThrow();
        // expect(() => myDerivable.react(doNothing, { from: false }))

        // When `from = false`, the reactor is disconnected, preventing the error message from entering.
        // `skipFirst`, on the other hand, does allow the value in, but just does not trigger an update.
        // This is similar if you change the boolean afterwards.

        // TODO: This is probably redundant.
        let b = false;
        expect(() => myDerivable.react(doNothing, { from: b })).not.toThrow();
        expect(() => (b = true)).not.toThrow();
    });

    // always is `stopOnError` used in a DERIVABLE.TAKE, not a DERIVABLE.REACT...?
    // libs/sherlock/src/lib/derivable/mixins/take.tests.ts
    // 1034, 825...

    it('`mapState` to reason over errors', () => {
        const mapping$ = myDerivable.mapState(state => {
            if (state === unresolved) {
                return atom('unresolved');
            }
            if (state instanceof ErrorWrapper) {
                return atom('error');
            }
            return atom(myDerivable.get().toString());
        });

        // You can get the mapped value out by using `.get()`. But then, to check the value of that atom, again `.get()`.
        expect(mapping$.get().get()).toBe('1');

        myDerivable.unset();
        expect(mapping$.get().get()).toBe('unresolved');

        myDerivable.setError('Just a random error.');
        expect(mapping$.get().get()).toBe('error');
    });

    it('TEMP', () => {
        // FINAL
        // libs/sherlock/src/lib/utils/final-wrapper.ts

        // TODO: EXPLAIN WHY YOU WOULD WANT THIS
        let myAtom$ = atom(1);

        // every atom has a `final` property.
        expect(myAtom$.final).toBeFalse();

        // you can make an atom final using the `makeFinal()` function.
        myAtom$.makeFinal();
        expect(myAtom$.final).toBeTrue();

        // final atoms cannot be set anymore, but can be get.
        expect(() => myAtom$.set(2)).toThrow('cannot set a final derivable');
        expect(() => myAtom$.get()).not.toThrow();

        // alternatively, you can set a last value before setting it to `final`.
        // Obviously, if the state is already `final`, this function will also throw an error.
        expect(() => myAtom$.setFinal(2)).toThrow('cannot set a final derivable');
        myAtom$ = atom(1); // reset
        myAtom$.setFinal(2); // try again
        expect(myAtom$.final).toBeTrue();

        // Every Derivable has a state. We have seen that states (`State<V>`) can be `undefined`, `ErrorWrapper`,
        // or any regular type `V`. Other states exist, such as the `MaybeFinalState<V>`. This state can be either
        // a normal state `State<V>` or a special `FinalWrapper<State<V>>` state. Let's see that in action.
        myAtom$ = atom(1);
        expect(myAtom$.getMaybeFinalState()).toBe(1); // `getMaybeFinalState` can return a normal state, which in turn can be a normal type
        myAtom$.makeFinal();
        expect(myAtom$.getMaybeFinalState()).toBeInstanceOf(FinalWrapper); // but `getMaybeFinalState` can also return a `FinalWrapper` type!

        myAtom$ = atom(1);
        // But what is the point of this? What can we do with these "states"?
        // You can pattern match on the state to find out what the situation is.
        //
        //
        // FIXME: But no seriously, what is the point of this STATE? You already have the boolean to check for final.
        // FIXME: and what is the difference between Constants and Finals? Just that you can SET a final whenever you want?
        //        then isn't a Final just more powerful than a constant?
        // FIXME: and when would you use this, in a real scenario?
        //
        //
        // Let's first define a small checking function as we don't know exactly what type we deal with.
        function verifyState<T>(state: MaybeFinalState<T>, value: T, final: boolean): void {
            if (state instanceof FinalWrapper) {
                expect(final).toBeTrue();
                expect(state.value).toBe(value);
            } else {
                expect(final).toBeFalse();
                expect(state).toBe(value);
            }
        }

        let myAtomState$ = myAtom$.getMaybeFinalState();
        verifyState(myAtomState$, 1, false); // the state is the same as my value.

        myAtom$.setFinal(2);
        myAtomState$ = myAtom$.getMaybeFinalState();
        verifyState(myAtomState$, 2, true); // the final state still contains my value!

        //
        //
        //

        const final$ = final(1);
        // finals cannot be `set`. See for yourself by uncommenting the next line.
        // const final$.value = 2;
        // finals can be `get`
        expect(final$.value).toBe(1);

        finalGetter;
        setFinalMethod;
        makeFinalMethod;
        // markFinal;

        // const myAtomMaybeFinal$ = myAtom$.getMaybeFinalState();
        // myAtomMaybeFinal$

        //   A normal state is called `State<V>; a final state is `FinalWrapper<State<V>>`, so a
        //   `MaybeFinalState<V>` can be either! ::
        // export type MaybeFinalState<V> = State<V> | FinalWrapper<State<V>>;
        // export type State<V> = V | unresolved | ErrorWrapper;

        let a: MaybeFinalState<number> = 1;
        // a FinalWrapper can be made using the `final` function.
        a = final(1); // similar to `atom`, but makes a FinalWrapper instead of an Atom.
        // This is just syntactic sugar for:
        a = FinalWrapper.wrap(1);
        a = FinalWrapper.wrap(a); // this does nothing.
        expect(a).toBeInstanceOf(FinalWrapper);

        // You can also use other functions.
        a = FinalWrapper.unwrap(a); // does the opposite: get the V out of the FinalWrapper<V>.
        expect(a).not.toBeInstanceOf(FinalWrapper); // now it is not a FinalWrapper, but a State<number>!

        // also has its own Map function
        a = FinalWrapper.map(1, v => v + 1);
        expect(a).toBe(2);
        a = FinalWrapper.map(final(1), v => v + 1);
        expect(a).toMatchObject(final(2));
    });
});

/**
 * Final States; (finalGetter, finalMethod, getMaybeFinalState, FinalWrapper, MaybeFinalState, _isFinal, makeFinal, markFinal, .final, .finalized, setFinal...)
 * Lens; (libs/sherlock/src/lib/derivable/lens.ts) - ???
 * x Lift; (libs/sherlock-utils/src/lib/lift.ts)
 * Peek; (libs/sherlock-utils/src/lib/peek.ts) - ???
 * x Template; (libs/sherlock-utils/src/lib/template.ts) - to make a string using a template literal. (Uses unwrap!!)
 * / Factory; (libs/sherlock/src/lib/derivable/factories.ts) - simply contains functions to create objects, namely
 *      lens; atom; constant; derive.
 * Flat-map; (libs/sherlock/src/lib/derivable/mixins/flat-map.ts) - ???
 * Fallback-to;
 */
