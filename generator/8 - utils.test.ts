import { atom, derive } from '@skunkteam/sherlock';
import { lift, pairwise, peek, scan, struct } from '@skunkteam/sherlock-utils';

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
expect(peek).toBe(peek);
expect(lift).toBe(lift);

/**
 * In the `sherlock-utils` lib, there are a couple of functions that can combine
 * multiple values of a single `Derivable` or combine multiple `Derivable`s into
 * one. We will show a couple of those here.
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
         * `oldValue`.*
         */
        myCounter$.derive(__YOUR_TURN__).react(reactSpy); // #QUESTION
        myCounter$.derive(pairwise((newVal, oldVal) => newVal - oldVal, 0)).react(reactSpy); // #ANSWER
        // myCounter$.derive(pairwise((newVal, oldVal) => (oldVal ? newVal - oldVal : newVal))).react(reactSpy); // OR: alternatively. // #ANSWER

        expect(reactSpy).toHaveBeenCalledTimes(1);
        expect(reactSpy).toHaveBeenLastCalledWith(1, expect.toBeFunction());

        myCounter$.set(3);

        expect(reactSpy).toHaveBeenCalledTimes(2);
        expect(reactSpy).toHaveBeenLastCalledWith(2, expect.toBeFunction()); // 3 (current value of `myCounter$`) - 1 (previous value of `myCounter$`)

        myCounter$.set(10);

        expect(reactSpy).toHaveBeenCalledTimes(3);
        expect(reactSpy).toHaveBeenLastCalledWith(7, expect.toBeFunction()); // 10 (current value of `myCounter$`) - 3 (previous value of `myCounter$`)
    });

    /**
     * `scan()` is the `Derivable` version of `Array.prototype.reduce()`. It will be
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
         * current.
         *
         * Note  that `scan()` must return the same type as it gets as input. This is required
         * as this returned value is also used for the accumulator (`acc`) value for the next call.
         * This `acc` parameter of `scan()` is the last returned value, not the last value
         * of `myCounter$`, as is the case with `pairwise()`.
         */
        myCounter$.derive(__YOUR_TURN__).react(reactSpy); // #QUESTION
        myCounter$.derive(scan((acc, val) => val - acc, 0)).react(reactSpy); // #ANSWER

        expect(reactSpy).toHaveBeenCalledTimes(1);
        expect(reactSpy).toHaveBeenLastCalledWith(1, expect.toBeFunction());

        myCounter$.set(3);

        expect(reactSpy).toHaveBeenCalledTimes(2);
        expect(reactSpy).toHaveBeenLastCalledWith(2, expect.toBeFunction()); // 3 (current value of `myCounter$`) - 1 (previous returned value)

        myCounter$.set(10);

        expect(reactSpy).toHaveBeenCalledTimes(3);
        expect(reactSpy).toHaveBeenLastCalledWith(8, expect.toBeFunction()); // 10 (current value of `myCounter$`) - 2 (previous returned value)
    });

    it('`pairwise()` on normal arrays', () => {
        // Functions like `pairwise()` and `scan()` work on normal lists too. They are often
        // used in combination with `map()` and `filter()`.
        const myList = [1, 2, 3, 5, 10];
        let myList2: number[];

        /**
         * ** Your Turn **
         *
         * Use a `pairwise()` combined with a `.map()` on `myList`
         * to subtract the previous value from the current.
         *
         * Hint: do not use a lambda function!
         */
        myList2 = myList.map(__YOUR_TURN__); // #QUESTION
        myList2 = myList.map(pairwise((newV, oldV) => newV - oldV, 0)); // #ANSWER
        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);

        // However, we should be careful with this, as this does not always behave as intended.
        myList2 = myList.map(v => __YOUR_TURN__(v)); // copy the same implementation here // #QUESTION
        myList2 = myList.map(v => pairwise((newV, oldV) => newV - oldV, 0)(v)); // copy the same implementation here // #ANSWER
        expect(myList2).toMatchObject([1, 2, 3, 5, 10]);

        // Even if we are more clear about what we pass, this unintended behavior does not go away.
        myList2 = myList.map((v, _, _2) => __YOUR_TURN__(v)); // copy the same implementation here // #QUESTION
        myList2 = myList.map((v, _, _2) => pairwise((newV, oldV) => newV - oldV, 0)(v)); // copy the same implementation here // #ANSWER
        expect(myList2).toMatchObject([1, 2, 3, 5, 10]);

        // `pairwise()` keeps track of the previous value under the hood. Using a lambda of
        // the form `v => pairwise(...)(v)` would create a new `pairwise` function every call,
        // essentially resetting the previous value every call. And resetting the previous value
        // to 0 causes the input to stay the same (after all: x - 0 = x).
        // Other than by not using a lambda function, we can fix this by
        // saving the `pairwise` in a variable and reusing it for every call.

        let f: (v: number) => number = __YOUR_TURN__; // copy the same implementation here // #QUESTION
        let f = pairwise((newV, oldV) => newV - oldV, 0); // #ANSWER
        myList2 = myList.map(v => f(v));
        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);

        // To get more insight in the `pairwise()` function, you can call it
        // manually. Here, we show what happens under the hood.

        f = pairwise(__YOUR_TURN__); // copy the same implementation here // #QUESTION
        f = pairwise((newV, oldV) => newV - oldV, 0); // #ANSWER

        myList2 = [];
        myList2[0] = f(myList[0]); // f is newly created with `init = 0`, so applies `1 - 0`.
        myList2[1] = f(myList[1]); // f has saved `1` internally, so applies `2 - 1`.
        myList2[2] = f(myList[2]); // f has saved `2` internally, so applies `3 - 2`.
        myList2[3] = f(myList[3]); // f has saved `3` internally, so applies `5 - 3`.
        myList2[4] = f(myList[4]); // f has saved `5` internally, so applies `10 - 5`.

        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);
        // This also works for functions other than `.map()`, such as `.filter()`.

        /** ** Your Turn **
         * Use `pairwise()` to filter out all values which produce `1` when subtracted
         * with their previous value.
         */
        myList2 = myList.filter(__YOUR_TURN__); // #QUESTION
        myList2 = myList.filter(pairwise((newV, oldV) => newV - oldV === 1, 0)); // #ANSWER
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
         */

        let f: (v: number) => number = scan(__YOUR_TURN__); // #QUESTION
        let f: (v: number) => number = scan((acc, val) => val - acc, 0); // #ANSWER
        myList2 = myList.map(f);

        expect(myList2).toMatchObject([1, 1, 2, 3, 7]);

        // again, it is useful to consider what happens internally.
        f(7); // resets the internal `acc` value to 0, as the current `acc` value was 7, and 7-7 = 0.

        myList2 = [];
        myList2[0] = f(myList[0]); // 1  ::  `f` is newly created with `init = 0`, so applies `1 - 0 = 1`.
        myList2[1] = f(myList[1]); // 1  ::  `f` has saved the result `1` internally, so applies `2 - 1 = 1`.
        myList2[2] = f(myList[2]); // 2  ::  `f` has saved the result `1` internally, so applies `3 - 1 = 2`.
        myList2[3] = f(myList[3]); // 3  ::  `f` has saved the result `2` internally, so applies `5 - 2 = 3`.
        myList2[4] = f(myList[4]); // 7  ::  `f` has saved the result `3` internally, so applies `10 - 3 = 7`.

        expect(myList2).toMatchObject([1, 1, 2, 3, 7]);

        // This also works for functions other than `map()`, such as `filter()`.
        // Use `scan()` to filter out all values from `myList` which produce a value
        // of 8 or higher when added with the previous result. In other words, it should
        // go through `myList` and add the values producing: (1), (1+2), (1+2+3), (1+2+3+5),
        // (1+2+3+5+10), and since this sum only prouces a value higher than 8 when the
        // values `5` and `10` are added, the result should be `[5,10]`.

        f = scan(__YOUR_TURN__); // #QUESTION
        myList2 = myList.filter(__YOUR_TURN__); // #QUESTION
        f = scan((acc, val) => val + acc, 0); // #ANSWER
        myList2 = myList.filter(v => f(v) >= 8); // #ANSWER
        expect(myList2).toMatchObject([5, 10]);
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
        reactSpy = jest.fn(__YOUR_TURN__); // #QUESTION
        reactSpy = jest.fn(pairwise((newV, oldV) => newV - oldV, 0)); // #ANSWER
        myCounter$.react(reactSpy);

        expect(reactSpy).toHaveLastReturnedWith(1);

        myCounter$.set(3);

        expect(reactSpy).toHaveLastReturnedWith(2);

        myCounter$.set(10);

        expect(reactSpy).toHaveLastReturnedWith(7);
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

        reactSpy = jest.fn(__YOUR_TURN__); // #QUESTION
        reactSpy = jest.fn(scan((acc, val) => val - acc, 0)); // #ANSWER
        myCounter$.react(reactSpy);

        expect(reactSpy).toHaveLastReturnedWith(1);

        myCounter$.set(3);

        expect(reactSpy).toHaveLastReturnedWith(2);

        myCounter$.set(10);

        expect(reactSpy).toHaveLastReturnedWith(8);
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

        // Note: we change the original object, not the struct.
        allMyAtoms.regularProp = 'new value';
        allMyAtoms.sub.string.set('my new substring');

        /**
         * ** Your Turn **
         *
         * Now have a look at the properties of `myOneAtom$`. Is this what you
         * expect?
         */
        // #QUESTION-BLOCK-START
        expect(myOneAtom$.get()).toEqual({
            regularProp: __YOUR_TURN__,
            string: __YOUR_TURN__,
            number: __YOUR_TURN__,
            sub: {
                string: __YOUR_TURN__,
            },
        });
        // #QUESTION-BLOCK-END
        // #ANSWER-BLOCK-START
        expect(myOneAtom$.get()).toEqual({
            regularProp: 'new value',
            string: 'my string',
            number: 1,
            sub: {
                string: 'my new substring',
            },
        });
        // #ANSWER-BLOCK-END
    });

    describe('lift()', () => {
        /**
         * Derivables can feel like a language build on top of Typescript. Sometimes
         * you might want to use normal objects and functions and not have to rewrite
         * your code.
         * In other words, just like keywords like `atom(V)` lifts a variable V to the higher
         * level of Derivables, the `lift(F)` keyword lifts a function `F` to the higher
         * level of Derivables.
         */
        it('example', () => {
            // Example: after years of effort, Bob finally finished his oh-so complicated function:
            const isEvenNumber = (v: number) => v % 2 == 0;

            // Rewriting this function to work with derivables would now be a waste of time.
            /**
             * ** Your Turn **
             * Use the `lift()` function to change `isEvenNumber` to work on Derivables instead.
             * In other words: the new function should take a `Derivable<number>` (or more specifically:
             * an `Unwrappable<number>`) and return a `Derivable<boolean>`.
             */
            const isEvenDerivable = __YOUR_TURN__; // #QUESTION
            const isEvenDerivable = lift(isEvenNumber); // #ANSWER

            expect(isEvenNumber(2)).toBe(true);
            expect(isEvenNumber(13)).toBe(false);
            expect(isEvenDerivable(atom(2)).get()).toBe(true);
            expect(isEvenDerivable(atom(13)).get()).toBe(false);
        });

        it('`lift()` as alternative to `.map()`', () => {
            // In tutorial 7, we saw `.map()` used in the following context:
            const addOne = jest.fn((v: number) => v + 1);
            const myAtom$ = atom(1);

            let myMappedDerivable$ = myAtom$.map(addOne);

            expect(myMappedDerivable$.value).toBe(2);

            /**
             * ** Your Turn **
             * Now, use `lift()` as alternative to `.map()`.
             */
            myMappedDerivable$ = __YOUR_TURN__; // #QUESTION
            myMappedDerivable$ = lift(addOne)(myAtom$); // #ANSWER

            expect(myMappedDerivable$.value).toBe(2);
        });
    });

    /**
     * Sometimes you want to use `derive` but still want to keep certain
     * variables in it untracked. In such cases, you can use `peek()`.
     */
    it('`peek()`', () => {
        const myTrackedAtom$ = atom(1);
        const myUntrackedAtom$ = atom(2);

        /**
         * ** Your Turn **
         * Use `peek()` to get the value of `myUntrackedAtom$` and add it to the
         * value of `myTrackedAtom$`, which should be tracked.
         */
        const reactor = jest.fn(v => v);
        derive(__YOUR_TURN__).react(reactor); // #QUESTION
        derive(() => myTrackedAtom$.get() + peek(myUntrackedAtom$)).react(reactor); // #ANSWER

        expect(reactor).toHaveBeenCalledOnce();
        expect(reactor).toHaveLastReturnedWith(3);

        myTrackedAtom$.set(2);
        expect(reactor).toHaveBeenCalledTimes(2);
        expect(reactor).toHaveLastReturnedWith(4);

        myUntrackedAtom$.set(3);
        expect(reactor).toHaveBeenCalledTimes(2);
        expect(reactor).toHaveLastReturnedWith(4);

        myTrackedAtom$.set(3);
        expect(reactor).toHaveBeenCalledTimes(3);
        expect(reactor).toHaveLastReturnedWith(6);
    });
});
