import { atom } from '@skunkteam/sherlock';
import { pairwise, scan, struct } from '@skunkteam/sherlock-utils';

/**
 * ** Your Turn **
 *
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;

// Silence TypeScript's import not used errors.
expect(pairwise).toBe(pairwise);
expect(scan).toBe(scan);
expect(struct).toBe(struct);

/**
 * In the `sherlock-utils` lib, there are a couple of functions that can combine
 * multiple values of a single `Derivable` or combine multiple `Derivable`s into
 * one. We will show a couple of those here.
 */
describe.skip('utils', () => {
    /**
     * As the name suggests, `pairwise()` will call the given function with both
     * the current and the previous state.
     *
     * *Note functions like `pairwise` and `scan` can be used with any callback,
     * so it can be used both in a `.derive()` step and in a `.react()`*
     */
    it('pairwise', () => {
        const myCounter$ = atom(1);
        const reactSpy = jest.fn();

        /**
         * ** Your Turn **
         *
         * Now, use `pairwise()`, to subtract the previous value from the
         * current.
         *
         * *Hint: check the overloads of pairwise if you're struggling with
         * `oldVal`.*
         */
        myCounter$.derive(__YOUR_TURN__).react(reactSpy);

        expect(reactSpy).toHaveBeenCalledExactlyOnceWith(1, expect.toBeFunction());

        myCounter$.set(3);

        expect(reactSpy).toHaveBeenCalledTimes(2);
        expect(reactSpy).toHaveBeenCalledWith(2, expect.toBeFunction());

        myCounter$.set(45);

        expect(reactSpy).toHaveBeenCalledTimes(3);
        expect(reactSpy).toHaveBeenCalledWith(42, expect.toBeFunction());
    });

    /**
     * `scan` is the `Derivable` version of `Array.prototype.reduce`. It will be
     * called with the current state and the last emitted value.
     *
     * (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
     *
     * *Note: as with `pairwise()` this is useable in both a `.derive()` and
     * `.react()` method*
     */
    it('scan', () => {
        const myCounter$ = atom(1);
        const reactSpy = jest.fn();

        /**
         * ** Your Turn **
         *
         * Now, use `scan()`, to add all the emitted values together
         */
        myCounter$.derive(__YOUR_TURN__).react(reactSpy);

        expect(reactSpy).toHaveBeenCalledExactlyOnceWith(1, expect.toBeFunction());

        myCounter$.set(3);

        expect(reactSpy).toHaveBeenCalledTimes(2);
        expect(reactSpy).toHaveBeenCalledWith(4, expect.toBeFunction());

        myCounter$.set(45);

        expect(reactSpy).toHaveBeenCalledTimes(3);
        expect(reactSpy).toHaveBeenCalledWith(49, expect.toBeFunction());

        /**
         * *BONUS: Try using `scan()` (or `pairwise()`) directly in the
         * `.react()` method.*
         */
    });

    it.skip('pairwise - BONUS', () => {
        const myCounter$ = atom(1);
        let lastPairwiseResult = 0;

        /**
         * ** Your Turn **
         * ** BONUS **
         *
         * Now, use `pairwise()` directly in `.react()`. Implement the same
         * derivation as before: subtract the previous value from the current.
         *
         * Instead of returning the computed value, assign it
         * `lastPairwiseResult` instead. This is so the implementation can be
         * validated.
         */
        myCounter$.react(__YOUR_TURN__);

        expect(lastPairwiseResult).toEqual(1);

        myCounter$.set(3);

        expect(lastPairwiseResult).toEqual(2);

        myCounter$.set(45);

        expect(lastPairwiseResult).toEqual(42);
    });

    it.skip('scan - BONUS', () => {
        const myCounter$ = atom(1);
        let lastScanResult = 0;

        /**
         * ** Your Turn **
         * ** BONUS **
         *
         * Now, use `scan()` directly in `.react()`. Implement the same
         * derivation as before: add all the emitted values together.
         *
         * In addition to returning the computed value, assign it
         * `lastScanResult` instead. This is so the implementation can be
         * validated.
         */
        myCounter$.react(__YOUR_TURN__);

        expect(lastScanResult).toEqual(1);

        myCounter$.set(3);
        expect(lastScanResult).toEqual(4);

        myCounter$.set(45);
        expect(lastScanResult).toEqual(49);
    });

    /**
     * A `struct()` can combine an Object/Array of `Derivable`s into one
     * `Derivable`, that contains the values of that `Derivable`.
     *
     * The Object/Array that is in the output of `struct()` will have the same
     * structure as the original Object/Array.
     *
     * This is best explained in practice.
     */
    it('struct', () => {
        const allMyAtoms = {
            regularProp: 'prop',
            string: atom('my string'),
            number: atom(1),
            sub: {
                string: atom('my substring'),
            },
        };

        const myOneAtom$ = struct(allMyAtoms);

        expect(myOneAtom$.get()).toEqual({
            regularProp: 'prop',
            string: 'my string',
            number: 1,
            sub: {
                string: 'my substring',
            },
        });

        allMyAtoms.regularProp = 'new value';
        allMyAtoms.sub.string.set('my new substring');

        /**
         * ** Your Turn **
         *
         * Now have a look at the properties of `myOneAtom$`. Is this what you
         * expect?
         */
        expect(myOneAtom$.get()).toEqual({
            regularProp: __YOUR_TURN__,
            string: __YOUR_TURN__,
            number: __YOUR_TURN__,
            sub: {
                string: __YOUR_TURN__,
            },
        });
    });
});
