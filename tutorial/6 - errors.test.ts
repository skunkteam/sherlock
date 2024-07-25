import { atom, DerivableAtom, error } from '@skunkteam/sherlock';

/**
 * ** Your Turn **
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;
/**
 * Errors are a bit part of any programming language, and Sherlock has its own custom errors
 * and ways to deal with them.
 */
describe.skip('errors', () => {
    let myAtom$: DerivableAtom<number>;

    beforeEach(() => {
        myAtom$ = atom(1);
    });

    it('basic errors', () => {
        // The `errored` property of a Derivable shows whether it is in an error state - meaning that
        // the last statement resulted in an error
        expect(myAtom$.errored).toBe(false);
        expect(myAtom$.error).toBeUndefined; // by default, the `error` message is undefined.

        // We can set errors using the `setError()` function.
        myAtom$.setError('my Error');

        expect(myAtom$.errored).toBe(true);
        expect(myAtom$.error).toBe('my Error');

        // expect(myAtom$.get).toThrow("Cannot read properties of undefined (reading 'getState')");
        // TODO: WHAT - normally this works, but internal JEST just fucks with me....?

        // What will happen if you try to call `get()` on `myAtom$`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.get()) /* __YOUR_TURN__ */; 

        // ** __YOUR_TURN__ **
        // What will happen if you try to call `set()` on `myAtom$`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.set(2)) /* __YOUR_TURN__ */; 
        expect(myAtom$.errored).toBe(__YOUR_TURN__); 

        // Interestingly, calling `set()` does not throw an error. In fact, it removes the error state
        // altogether. This means we can now call `get()` again.
        expect(() => myAtom$.get()).not.toThrow();
    });

    /**
     * libs/sherlock/src/lib/interfaces.ts:289  shows the basic states that a Derivable can have.
     * >    `export type State<V> = V | unresolved | ErrorWrapper;`
     * A state can be either any type `V` (`number`, `string`, etc.), `unresolved` as we saw in the
     * previous tutorial, or `ErrorWrapper`. This last state is explained here.
     */
    it('error states', () => {
        expect(myAtom$.getState()).toBe(1); // as explained above, any type can be a state

        myAtom$.setError('my Error');

        // The `ErrorWrapper` state only holds an error string. The `error()` function returns
        // such an `ErrorWrapper` which we can use to compare.
        expect(myAtom$.getState()).toMatchObject(error('my Error'));

        // TODO: more! There wasn't a question in here. Maybe combine with Final States? NO, that one should go!
    });

    it('deriving an error', () => {
        const myDerivable$ = myAtom$.derive(v => v + 1);

        // If `myAtom$` suddenly errors...
        myAtom$.setError('division by zero');

        // ...what happens to `myDerivable$`?
        expect(myDerivable$.errored).toBe(__YOUR_TURN__); 

        // If any Derivable tries to derive from an atom in an error state,
        // this Derivable will itself throw an error too. This makes sense,
        // given that it cannot obtain the value it needs.
    });

    it('reacting to an error', () => {
        // Setting an error to an Atom generally does not throw an error.
        expect(() => myAtom$.setError('my Error')).not.toThrow();

        myAtom$.set(1);

        // Now we set a reactor to `myAtom$`. However, this reactor does not use the value of `myAtom$`.
        const reactor = jest.fn(); // empty function body
        myAtom$.react(reactor);

        // ** __YOUR_TURN__ **
        // Will an error be thrown when `myAtom$` is now set to an error state?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.setError('my Error')) /* __YOUR_TURN__ */; 

        // ** __YOUR_TURN__ **
        // Is the reactor still connected now that it errored?
        expect(myAtom$.connected).toBe(__YOUR_TURN__); 

        // Reacting to a Derivable that throws an error will make the reactor throw as well.
        // Because the reactor will usually fire when it gets connected, it also throws when
        // you try to connect it after the error has already been set.

        myAtom$ = atom(1);
        myAtom$.setError('my second Error'); //

        // ** __YOUR_TURN__ **
        // Will an error be thrown when you use `skipFirst`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.react(reactor, { skipFirst: true })) /* __YOUR_TURN__ */; 

        // And will an error be thrown when `from = false`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.react(reactor, { from: false })) /* __YOUR_TURN__ */; 

        // When `from = false`, the reactor is disconnected, preventing the error message from entering.
        // `skipFirst`, on the other hand, does allow the error in, but does not trigger an update.
    });
});
