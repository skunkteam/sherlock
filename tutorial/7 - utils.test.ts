import { atom, Derivable } from '@skunkteam/sherlock';
import { lift, pairwise, scan, struct } from '@skunkteam/sherlock-utils';

// FIXME: // interne review document, mocht ik iets hebben om te laten zien! In Google Drive, zet het erin!

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
 * one. We will show a couple of those here. TODO: Hmm, I want to see some others too!
 */
describe('utils', () => {
    /**
     * As the name suggests, `pairwise()` will call the given function with both
     * the current and the previous state.
     *
     * *Note: functions like `pairwise` and `scan` can be used with any callback,
     * so it can be used both in a `.derive()` step and in a `.react()`*
     */
    it('pairwise', () => {
        const myCounter$ = atom(1);
        const reactSpy = jest.fn();

        /**
         * ** Your Turn **
         *
         * Now, use `pairwise()` to subtract the previous value from the
         * current.
         *
         * *Hint: check the overloads of pairwise if you're struggling with
         * `oldVal`.*
         */
        myCounter$.derive(pairwise((newVal, oldVal) => (oldVal ? newVal - oldVal : newVal))).react(reactSpy);
        // myCounter$.derive(pairwise((newVal, oldVal) => newVal - oldVal, 0)).react(reactSpy); // OR: alternatively.

        expect(reactSpy).toHaveBeenCalledExactlyOnceWith(1, expect.toBeFunction());

        myCounter$.set(5);

        expect(reactSpy).toHaveBeenCalledTimes(2);
        expect(reactSpy).toHaveBeenCalledWith(4, expect.toBeFunction());

        myCounter$.set(45);

        expect(reactSpy).toHaveBeenCalledTimes(3);
        expect(reactSpy).toHaveBeenCalledWith(40, expect.toBeFunction());
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
         * Now, use `scan()` to subtract the previous value from the
         * current. TODO:
         */
        myCounter$.derive(scan((acc, val) => val + acc, 0)).react(reactSpy);

        expect(reactSpy).toHaveBeenCalledExactlyOnceWith(1, expect.toBeFunction());

        myCounter$.set(5);

        expect(reactSpy).toHaveBeenCalledTimes(2);
        expect(reactSpy).toHaveBeenCalledWith(6, expect.toBeFunction());

        myCounter$.set(45);

        expect(reactSpy).toHaveBeenCalledTimes(3);
        expect(reactSpy).toHaveBeenCalledWith(51, expect.toBeFunction());

        /**
         * *BONUS: Try using `scan()` (or `pairwise()`) directly in the
         * `.react()` method.*
         */
    });

    // TODO: dit laat niet mooi het verschil zien. Hier lijkt het net alsof ze hetzelfde doen!
    // En `scan` naar `val - acc` veranderen werkt niet. Geeft weird gedrag.

    it('scan2', () => {
        // const myList$ = atom([]);
        const myInt$ = atom(1);
        const reactSpy = jest.fn();
        const f: (n1: number, n2: number) => number[] = (newVal, oldVal) => [newVal + oldVal];
        const d: number = 0;
        let stopper: () => void;

        myInt$.derive(pairwise(f, d));
        // this is actually the same as:
        myInt$.derive(v => pairwise(f, d)(v));
        // it just uses partial application. Pairwise itself is a function after all, which you apply to some value.
        // This value then internally has a `previous state` property somewhere.

        // 1) this is one way or writing a derivable + react.
        const myList$: Derivable<number[]> = myInt$.derive(pairwise(f, d));
        stopper = myList$.react(reactSpy);
        stopper();

        // 2) the value of `myList$` is now directly passed to `reactSpy` without it being an extra variable.
        // since we can get the value out of the `reactSpy`, this might be all we need.
        stopper = myInt$.derive(pairwise(f, d)).react(reactSpy);
        stopper();

        // Let's try it out for real.
        // The previous exercise made it seem like `pairwise` and `scan` do similar things. This is not true.
        stopper = myInt$.derive(pairwise(f, d)).react(reactSpy);

        myInt$.set(2);
        myInt$.set(3);
        myInt$.set(4);

        expect(reactSpy).toHaveBeenCalledWith([3 + 4], expect.toBeFunction());
        stopper();

        // Now let's to the same with scan. Already, the types don't match.
        // The return type must be number (uncomment to see error).
        // stopper = myInt$.derive(scan(f, d)).react(reactSpy);
        // TODO: why?

        const f2: (n1: number, n2: number) => number = (newVal, oldVal) => newVal + oldVal;
        stopper = myInt$.derive(scan(f2, d)).react(reactSpy); // starts at 4

        myInt$.set(2); // then becomes 6
        myInt$.set(3); // then becomes 9
        myInt$.set(4); // lastly, becomes 13

        expect(reactSpy).toHaveBeenCalledWith(13, expect.toBeFunction());
        stopper();

        // -------
        // -------
        // -------
        // -------

        // expect(reactSpy).toHaveBeenCalledExactlyOnceWith(1, expect.toBeFunction());

        // myCounter$.set(5);

        // expect(reactSpy).toHaveBeenCalledTimes(2);
        // expect(reactSpy).toHaveBeenCalledWith(6, expect.toBeFunction());

        // myCounter$.set(45);

        // expect(reactSpy).toHaveBeenCalledTimes(3);
        // expect(reactSpy).toHaveBeenCalledWith(51, expect.toBeFunction());

        /**
         * *BONUS: Try using `scan()` (or `pairwise()`) directly in the
         * `.react()` method.*
         */
    });

    it('`pairwise()` on normal arrays', () => {
        // Functions like `pairwise()` and `scan()` work on normal lists too. They are often
        // used in combination with `map()` and `filter()`.
        const myList = [1, 2, 3, 5, 10];
        let myList2: number[];

        /**
         * ** Your Turn **
         *
         * Use a `pairwise()` combined with a `map` on `myList`
         * to subtract the previous value from the current.
         *
         * Hint: do not use a lambda function!
         */

        // let oldValue = init; - libs/sherlock-utils/src/lib/pairwise.ts:24
        // Closures?? TODO:

        // myList2 = myList.map(pairwise((newV, oldV) => newV - oldV, 0));
        myList2 = myList.map(__YOUR_TURN__);
        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);

        // However, we should be careful with this, as this does not always behave as intended.
        myList2 = myList.map(v => __YOUR_TURN__(v)); // copy the same implementation here
        expect(myList2).toMatchObject([1, 2, 3, 5, 10]);

        // Even if we are more clear about what we pass, this unintended behavior does not go away.
        myList2 = myList.map((v, _, _2) => __YOUR_TURN__(v)); // copy the same implementation here
        expect(myList2).toMatchObject([1, 2, 3, 5, 10]);

        // `pairwise()` keeps track of the previous value under the hood. Using a lambda of
        // the form `v => pairwise(...)(v)` would create a new `pairwise` function every call,
        // essentially resetting the previous value every call. And resetting the previous value
        // to 0 causes the input to stay the same (after all: x - 0 = x).
        // We can solve this by saving the `pairwise` in a variable and reusing it for every call.

        // let f = pairwise((newV, oldV) => newV - oldV, 0);
        let f: (v: number) => number = __YOUR_TURN__; // copy the same implementation here
        myList2 = myList.map(v => f(v));
        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);

        // To get more insight in the `pairwise()` function, you can also just call it
        // manually. Here, we show what happens under the hood.

        // f = pairwise((newV, oldV) => newV - oldV, 0);
        f = pairwise(__YOUR_TURN__); // copy the same implementation here

        myList2 = [];
        myList2[0] = f(myList[0]); // f is newly created with `init = 0`, so applies `1 - 0`.
        myList2[1] = f(myList[1]); // f has saved `1` internally, so applies `2 - 1`.
        myList2[2] = f(myList[2]); // f has saved `2` internally, so applies `3 - 2`.
        myList2[3] = f(myList[3]); // f has saved `3` internally, so applies `5 - 3`.
        myList2[4] = f(myList[4]); // f has saved `5` internally, so applies `10 - 5`.

        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);

        // This also works for functions other than `map()`, such as `filter()`.
        // Use `pairwise()` to filter out all values which produce `1` when subtracted
        // with their previous value.

        // myList2 = myList.filter(pairwise((newV, oldV) => newV - oldV === 1, 0));
        myList2 = myList.filter(__YOUR_TURN__);
        expect(myList2).toMatchObject([1, 2, 3]);
    });

    it('`scan()` on normal arrays', () => {
        // As with `pairwise()` in the last test, `scan()` can be used with arrays too.
        const myList = [1, 2, 3, 5, 10];
        let myList2: number[];

        /**
         * ** Your Turn **
         *
         * Use a `scan()` combined with a `map` on `myList`
         * to subtract the previous value from the current.
         *
         * Hint: do not use a lambda function!
         * TODO: instead, make them write expectancies rather than the implementation. Is way nicer?
         */

        myList2 = myList.map(scan((acc, val) => val - acc, 0));
        // myList2 = myList.map(__YOUR_TURN__);
        expect(myList2).toMatchObject([1, 1, 2, 3, 7]);

        // again, it is useful to consider what happens internally.
        let f: (v: number) => number = scan((acc, val) => val - acc, 0);
        // let f: (v: number) => number = pairwise(__YOUR_TURN__); // copy the same implementation here

        myList2 = [];
        myList2[0] = f(myList[0]); // 1  ::  f is newly created with `init = 0`, so applies `1 - 0 = 1`.
        myList2[1] = f(myList[1]); // 1  ::  f has saved the result `1` internally, so applies `2 - 1 = 1`.
        myList2[2] = f(myList[2]); // 2  ::  f has saved the result `1` internally, so applies `3 - 1 = 2`.
        myList2[3] = f(myList[3]); // 3  ::  f has saved the result `2` internally, so applies `5 - 2 = 3`.
        myList2[4] = f(myList[4]); // 7  ::  f has saved the result `3` internally, so applies `10 - 3 = 7`.

        expect(myList2).toMatchObject([1, 1, 2, 3, 7]);

        // This also works for functions other than `map()`, such as `filter()`.
        // Use `scan()` to filter out all values which produce `1` when subtracted
        // with the previous result.
        // TODO: note (earlier) that `scan()` must return the same type as it gets as input. This is required
        // as this returned value is also used for the accumulator value for the next call!

        // f = scan((acc, val) => val - acc, 0);
        // myList2 = myList.filter(v => f(v) == 1);
        f = scan(__YOUR_TURN__);
        myList2 = myList.filter(__YOUR_TURN__);
        expect(myList2).toMatchObject([1, 2]); // Only the numbers `1` and `2` from `myList` return `1`.
    });

    it('pairwise - BONUS', () => {
        const myCounter$ = atom(1);
        let reactSpy = jest.fn();

        /**
         * ** Your Turn **
         * ** BONUS **
         *
         * Now, use `pairwise()` directly in `.react()`. Implement the same
         * derivation as before: subtract the previous value from the current.
         */

        reactSpy = jest.fn(pairwise((newV, oldV) => newV - oldV, 0));
        // reactSpy = jest.fn(__YOUR_TURN__);
        myCounter$.react(reactSpy);

        expect(reactSpy).toHaveLastReturnedWith(1);

        myCounter$.set(3);

        expect(reactSpy).toHaveLastReturnedWith(2);

        myCounter$.set(45);

        expect(reactSpy).toHaveLastReturnedWith(42); // 45 - 3 (last value of `myCounter$`)
    });

    it('scan - BONUS', () => {
        const myCounter$ = atom(1);
        let reactSpy = jest.fn();

        /**
         * ** Your Turn **
         * ** BONUS **
         *
         * Now, use `scan()` directly in `.react()`. Implement the same
         * derivation as before: subtract all the emitted values.
         */

        reactSpy = jest.fn(scan((acc, val) => val - acc, 0));
        // reactSpy = jest.fn(__YOUR_TURN__);
        // NOTE: acc is the last returned value, not the last value of `myCounter$`!! They are not the same!
        myCounter$.react(reactSpy);
        // TODO: can I also get all reactors within `myCounter$`?

        expect(reactSpy).toHaveLastReturnedWith(1);

        myCounter$.set(3);

        expect(reactSpy).toHaveLastReturnedWith(2);

        myCounter$.set(45);

        expect(reactSpy).toHaveLastReturnedWith(43); // 45 - 2 (last returned value) = 43 TODO: show this difference better!
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
            regularProp: 'new value', // it turns everything in a atom, sure
            string: 'my string', // but why does changing the original normal string work?? TODO: does it listen to that actual struct (string) now??
            number: 1,
            sub: {
                string: 'my new substring',
            },
        });
    });

    it('lift', () => {
        // Derivables can feel like a language build on top of Typescript. Sometimes
        // you might want to use normal objects and functions and not have to rewrite
        // your code.
        // In other words, just like keywords like `atom(V)` lift the type `V` to the higher
        // level of Derivables, the `lift(F)` keyword lifts a function `F` to the higher
        // level of Derivables.

        // Example: after years of effort, I finally finished my super-long function:
        const isEvenNumber = (v: number) => v % 2 == 0;

        // TODO:
        // So rewriting this function to work with derivables would be a waste of time.
        // YOUR TURN, use lift to reuse `isEvenNumber` on derivable level.
        const isEvenDerivable = lift(isEvenNumber);

        expect(isEvenNumber(2)).toBe(true);
        expect(isEvenNumber(13)).toBe(true);
        expect(isEvenDerivable(atom(2))).toMatchObject(atom(true));
        expect(isEvenDerivable(atom(13))).toMatchObject(atom(false));
    });

    // TODO:
    it('peek', () => {});
});
