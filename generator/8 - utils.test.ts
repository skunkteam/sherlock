import { atom, constant, Derivable, derive, ErrorWrapper, FinalWrapper } from '@skunkteam/sherlock';
import {
    fromEventPattern,
    fromObservable,
    fromPromise,
    lift,
    pairwise,
    peek,
    scan,
    struct,
} from '@skunkteam/sherlock-utils';
import { Atom } from 'libs/sherlock/src/internal';
import { from, Observable, Subject } from 'rxjs';

// #QUESTION-BLOCK-START
/**
 * ** Your Turn **
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;

// Silence TypeScript's import not used errors.
expect(pairwise).toBe(pairwise);
expect(scan).toBe(scan);
expect(struct).toBe(struct);
expect(peek).toBe(peek);
expect(lift).toBe(lift);
expect(fromObservable).toBe(fromObservable);
expect(from).toBe(from);
expect(ErrorWrapper).toBe(ErrorWrapper);
expect(Observable).toBe(Observable);
expect(FinalWrapper).toBe(FinalWrapper);
// #QUESTION-BLOCK-END
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
         *
         * Note: don't call `pairwise()` using a lambda function!
         */
        myCounter$.derive(__YOUR_TURN__).react(reactSpy); // #QUESTION
        myCounter$.derive(pairwise((newVal, oldVal) => newVal - oldVal, 0)).react(reactSpy); // #ANSWER

        expect(reactSpy).toHaveBeenCalledTimes(1);
        expect(reactSpy).toHaveBeenLastCalledWith(1, expect.toBeFunction());

        myCounter$.set(3);

        expect(reactSpy).toHaveBeenCalledTimes(2);
        expect(reactSpy).toHaveBeenLastCalledWith(2, expect.toBeFunction()); // 3 (current value of `myCounter$`) - 1 (previous value of `myCounter$`)

        myCounter$.set(10);

        expect(reactSpy).toHaveBeenCalledTimes(3);
        expect(reactSpy).toHaveBeenLastCalledWith(7, expect.toBeFunction()); // 10 (current value of `myCounter$`) - 3 (previous value of `myCounter$`)

        myCounter$.set(20);

        // ** Your Turn **
        // What will the next output be?
        expect(reactSpy).toHaveBeenCalledTimes(4);
        expect(reactSpy).toHaveBeenLastCalledWith(__YOUR_TURN__, expect.toBeFunction()); // #QUESTION
        expect(reactSpy).toHaveBeenLastCalledWith(10, expect.toBeFunction()); // 20 (current value of `myCounter$`) - 10 (previous value of `myCounter$`) // #ANSWER
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
         *
         * Note: don't call `pairwise()` using a lambda function!
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

        myCounter$.set(20);

        // ** Your Turn **
        // What will the next output be?
        expect(reactSpy).toHaveBeenCalledTimes(4);
        expect(reactSpy).toHaveBeenLastCalledWith(__YOUR_TURN__, expect.toBeFunction()); // #QUESTION
        expect(reactSpy).toHaveBeenLastCalledWith(12, expect.toBeFunction()); // 20 (current value of `myCounter$`) - 8 (previous returned value) // #ANSWER
    });

    it('`pairwise()` on normal arrays', () => {
        // Functions like `pairwise()` and `scan()` work on normal lists too. They are often
        // used in combination with `.map()` and `.filter()`.
        const myList = [1, 2, 3, 5, 10];
        let myList2: number[];

        /**
         * ** Your Turn **
         *
         * Use a `pairwise()` combined with a `.map()` on `myList`
         * to subtract the previous value from the current.
         *
         * Note: don't call `pairwise()` using a lambda function!
         */
        myList2 = myList.map(__YOUR_TURN__); // #QUESTION
        myList2 = myList.map(pairwise((newV, oldV) => newV - oldV, 0)); // #ANSWER
        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);

        // However, we should be careful with this, as this does not always behave as intended.
        // Particularly, what exactly happens when we do call `pairwise()` using a lambda function?
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
        myList2[0] = f(myList[0]); // `f` is newly created with `init = 0`, so applies `1 - 0 = 1`.
        myList2[1] = f(myList[1]); // `f` has saved `1` internally, so applies `2 - 1 = 1`.
        myList2[2] = f(myList[2]); // `f` has saved `2` internally, so applies `3 - 2 = 1`.
        myList2[3] = f(myList[3]); // `f` has saved `3` internally, so applies `5 - 3 = 2`.
        myList2[4] = f(myList[4]); // `f` has saved `5` internally, so applies `10 - 5 = 5`.

        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);

        // This also works for functions other than `.map()`, such as `.filter()`.

        /** ** Your Turn **
         * Use `pairwise()` to filter out all values which produce `1` when subtracted
         * with their previous value.
         * Note that the function `f` still requires a number to be the return value.
         * Checking for equality therefore cannot be done directly within `f`.
         */
        f = __YOUR_TURN__; // #QUESTION
        myList2 = myList.filter(__YOUR_TURN__); // #QUESTION
        f = pairwise((newV, oldV) => newV - oldV, 0); // #ANSWER
        myList2 = myList.filter(v => f(v) === 1); // #ANSWER

        expect(myList2).toMatchObject([1, 2, 3]); // only the numbers `1`, `2`, and `3` produce 1 when subtracted with the previous value
    });

    it('`scan()` on normal arrays', () => {
        // As with `pairwise()` in the last test, `scan()` can be used with arrays too.
        const myList = [1, 2, 3, 5, 10];
        let myList2: number[];

        /**
         * ** Your Turn **
         *
         * Use a `scan()` combined with a `.map()` on `myList`
         * to subtract the previous value from the current.
         */
        let f: (v: number) => number = scan(__YOUR_TURN__); // #QUESTION
        let f: (v: number) => number = scan((acc, val) => val - acc, 0); // #ANSWER
        myList2 = myList.map(f);

        expect(myList2).toMatchObject([1, 1, 2, 3, 7]);

        // again, it is useful to consider what happens internally.
        f(7); // reset -- this resets the internal `acc` value to 0, as the current `acc` value was 7, and 7-7 = 0.

        myList2 = [];
        myList2[0] = f(myList[0]); // `f` is newly created with `init = 0`, so applies `1 - 0 = 1`.
        myList2[1] = f(myList[1]); // `f` has saved the result `1` internally, so applies `2 - 1 = 1`.
        myList2[2] = f(myList[2]); // `f` has saved the result `1` internally, so applies `3 - 1 = 2`.
        myList2[3] = f(myList[3]); // `f` has saved the result `2` internally, so applies `5 - 2 = 3`.
        myList2[4] = f(myList[4]); // `f` has saved the result `3` internally, so applies `10 - 3 = 7`.

        expect(myList2).toMatchObject([1, 1, 2, 3, 7]);

        // This also works for functions other than `map()`, such as `filter()`.

        /**
         * ** Your Turn **
         * Use `scan()` to filter out all values from `myList` which produce a value
         * of 8 or higher when added with the previous result. In other words, it should
         * go through `myList` and add the values producing: (1), (1+2), (1+2+3), (1+2+3+5),
         * (1+2+3+5+10), and since this sum only prouces a value higher than 8 when the
         * values `5` and `10` are added, the result should be `[5,10]`.
         */
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
         * Sherlock may feel like a language build on top of Typescript. Sometimes
         * you might want to use normal objects and functions and not have to rewrite
         * your code.
         * In other words, just as keywords like `atom(V)` lifts a variable V to the higher
         * level of Derivables, the `lift(F)` keyword lifts a function `F` to the higher
         * level of Derivables.
         */
        it('example', () => {
            // Say I just finished writing this oh-so-complicated function:
            const isEvenNumber = (v: number) => v % 2 == 0;

            /**
             * Rewriting this function to work with derivables would now be a waste of time.
             * This is especially so if you didn't even write the original function, e.g. when
             * you use a library function.
             *
             * ** Your Turn **
             * Use the `lift()` function to change `isEvenNumber` to work on Derivables instead.
             * In other words: the new function should take a `Derivable<number>` (or more specifically:
             * an `Unwrappable<number>`) and return a `Derivable<boolean>`.
             */
            const isEvenDerivable = __YOUR_TURN__; // #QUESTION
            const isEvenDerivable = lift(isEvenNumber); // #ANSWER

            expect(isEvenNumber(2)).toBe(true);
            expect(isEvenNumber(13)).toBe(false);
            expect(isEvenDerivable(atom(2)).value).toBe(true);
            expect(isEvenDerivable(atom(13)).value).toBe(false);
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

        // there reactor should be called when `myTrackedAtom$` updates
        myTrackedAtom$.set(2);
        expect(reactor).toHaveBeenCalledTimes(2);
        expect(reactor).toHaveLastReturnedWith(4);

        // the reactor should not be called when `myUntrackedAtom$` updates
        myUntrackedAtom$.set(3);
        expect(reactor).toHaveBeenCalledTimes(2);
        expect(reactor).toHaveLastReturnedWith(4);

        // but when `myTrackedAtom$` updates, the value of `myUntrackedAtom$` did change
        myTrackedAtom$.set(3);
        expect(reactor).toHaveBeenCalledTimes(3);
        expect(reactor).toHaveLastReturnedWith(6);
    });

    /**
     * Similarly to the `constants` explained in tutorial 7,
     * you might want to specify that a variable cannot be updated.
     * This can be useful for the programmers themselves, to not
     * accidentally update the variable, but it can also be useful for
     * optimization. This can be done using the `final` keyword.
     */
    describe('`final`', () => {
        let myAtom$ = atom(1);

        beforeEach(() => {
            myAtom$ = atom(1);
        });

        it('`final` basics', () => {
            // Every atom has a `final` property.
            expect(myAtom$.final).toBeFalse();

            // You can make an atom final using the `.makeFinal()` function.
            myAtom$.makeFinal();
            expect(myAtom$.final).toBeTrue();

            /**
             * ** Your Turn **
             * What do you think will happen when we try to `.get()` or `.set()` this atom?
             */
            // .toThrow() or .not.toThrow()? ↴
            expect(() => myAtom$.get()) /*__YOUR_TURN__*/; // #QUESTION
            expect(() => myAtom$.set(2)) /*__YOUR_TURN__*/; // #QUESTION
            expect(() => myAtom$.get()).not.toThrow(); // #ANSWER
            expect(() => myAtom$.set(2)).toThrow('cannot set a final derivable'); // #ANSWER

            // This behavior is consistent with normal variables created using `const`.

            // Alternatively, you can set a last value before setting it to `final`, using `.setFinal()`.
            // .toThrow() or .not.toThrow()? ↴
            expect(() => myAtom$.setFinal(2)) /*__YOUR_TURN__*/; // #QUESTION
            expect(() => myAtom$.setFinal(2)).toThrow('cannot set a final derivable'); // #ANSWER
            // Remember: we try to set an atom that is already final, so we get an error // #ANSWER

            // There is no way to 'unfinalize' a Derivable, so the only solution to reset is to
            // create a whole new Derivable.
            myAtom$ = atom(1);
            myAtom$.setFinal(2);
            expect(myAtom$.final).toBeTrue();

            // Also interesting: a `constant` as introduced in tutorial 7 is actually a Derivable set to
            // `final` in disguise. You can verify this by checking the implementation of `constant` at
            // libs/sherlock/src/lib/derivable/factories.ts:39
            const myConstantAtom$ = constant(1);
            expect(myConstantAtom$.final).toBe(__YOUR_TURN__); // #QUESTION
            expect(myConstantAtom$.final).toBe(true); // #ANSWER
        });

        it('deriving a `final` Derivable', () => {
            const myDerivable$ = myAtom$.derive(v => v + 1);

            const hasReacted = jest.fn();
            myDerivable$.react(hasReacted);

            expect(myDerivable$.final).toBeFalse();
            expect(myDerivable$.connected).toBeTrue();

            myAtom$.makeFinal();

            /**
             * ** Your Turn **
             *
             * What will happen to `myDerivable$` when I change `myAtom$` to be `final`?
             */
            expect(myDerivable$.final).toBe(__YOUR_TURN__); // #QUESTION
            expect(myDerivable$.final).toBe(true); // #ANSWER
            expect(myDerivable$.connected).toBe(__YOUR_TURN__); // #QUESTION
            expect(myDerivable$.connected).toBe(false); // #ANSWER

            /**
             * Derivables that are final (or constant) are no longer tracked. This can save
             * a lot of memory and time by cleaning up unused data. Also, when all the variables
             * that a Derivable depends on become final, that Derivable itself becomes final too.
             * This chains similarly to `unresolved` and `error`.
             */
        });

        it('`final` State', () => {
            /**
             * We have seen that states (`State<V>`) can be `unresolved`, `ErrorWrapper`,
             * or any regular type `V`. If you want to also show whether a Derivable is `final`, you can
             * use the `MaybeFinalState<V>`, which is either any normal `State<V>` or a special
             * `FinalWrapper<State<V>>` state. Let's see that in action.
             */
            myAtom$.set(2);
            expect(myAtom$.getMaybeFinalState()).toBe(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.getMaybeFinalState()).toBe(2); // `getMaybeFinalState` can return a normal state, which in turn can be any normal type. // #ANSWER

            myAtom$.setError('2');
            expect(myAtom$.getMaybeFinalState()).toBeInstanceOf(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.getMaybeFinalState()).toBeInstanceOf(ErrorWrapper); // `getMaybeFinalState()` can return a normal state, which in turn can be unresolved. // #ANSWER

            myAtom$.setFinal(2);
            expect(myAtom$.getMaybeFinalState()).toBeInstanceOf(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.getState()).toBe(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.getMaybeFinalState()).toBeInstanceOf(FinalWrapper); // but `getMaybeFinalState)_` can also return a `FinalWrapper` type. // #ANSWER
            expect(myAtom$.getState()).toBe(2); // the normal `getState()` function cannot return a FinalWrapper. // #ANSWER
        });
    });

    describe('`Promise`, `Observable`, and `fromEventPattern`', () => {
        /**
         * Sherlock can also deal with Promises using the `.fromPromise()` and `.toPromise()` functions.
         * This translates Promises directly to Sherlock concepts we have discussed already.
         */
        it('`fromPromise()`', async () => {
            /**
             * `.fromPromise()` returns an atom that is linked to the Promise it is based on.
             * We initialize a Promise that will resolve, not reject, when handled
             */
            let promise = Promise.resolve(15);
            let myAtom$ = fromPromise(promise);

            /**
             * ** Your Turn **
             * What do you think is the default state of an atom based on a Promise?
             */
            expect(myAtom$.value).toBe(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.final).toBe(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.value).toBe(undefined); // #ANSWER
            expect(myAtom$.final).toBe(false); // #ANSWER

            // Now we wait for the Promise to be handled (resolved).
            await promise;

            /**
             * ** Your Turn **
             * So, what will happen to `myAtom$`?
             */
            expect(myAtom$.value).toBe(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.final).toBe(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.value).toBe(15); // #ANSWER
            expect(myAtom$.final).toBe(true); // #ANSWER

            // Now we make a promise that is rejected when called.
            promise = Promise.reject('Oh no, I messed up!');
            myAtom$ = fromPromise(promise);

            // As expected, the promise gets rejected.
            await expect(promise).rejects.toBe('Oh no, I messed up!');

            /**
             * ** Your Turn **
             * So, what will happen to `myAtom$` now?
             */
            expect(myAtom$.errored).toBe(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.error).toBe(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.final).toBe(__YOUR_TURN__); // #QUESTION
            expect(myAtom$.errored).toBe(true); // #ANSWER
            expect(myAtom$.error).toBe('Oh no, I messed up!'); // #ANSWER
            expect(myAtom$.final).toBe(true); // #ANSWER
        });

        it('`.toPromise()`', async () => {
            /**
             * `.toPromise()` returns a promise that is linked to the atom it is based on (`myAtom$` here). Note how this is the reverse of `fromPromise()`.
             * If the atom has a value, the promise is resolved. If the atom errors, the promise is rejected using the same error.
             * And it the atom is unresolved, the promise is pending.
             */
            let myAtom$ = atom('initial value');
            let promise = myAtom$.toPromise();

            /**
             * ** Your Turn **
             * What do you think will happen when we try to set the atom with a value?
             */
            myAtom$.set('second value');
            // `.resolves`  or  `.rejects`? ↴
            await expect(promise) /*__YOUR_TURN__*/ // #QUESTION
                .toBe(__YOUR_TURN__); // #QUESTION
            await expect(promise).resolves.toBe('initial value'); // `myAtom$` starts with a value ('initial value'), so the promise is immediately resolved // #ANSWER

            myAtom$.unset(); // reset

            promise = myAtom$.toPromise();

            /**
             * ** Your Turn **
             * We set the atom to `unresolved`. What will now happen when we try to set the atom with a value?
             */
            myAtom$.set('third value');
            // `.resolves`  or  `.rejects`? ↴
            await expect(promise) /*__YOUR_TURN__*/ // #QUESTION
                .toBe(__YOUR_TURN__); // #QUESTION
            await expect(promise).resolves.toBe('third value'); // This is now the first value the atom obtains since the promise was created. // #ANSWER

            // Whenever an atom is in an `unresolved` state, the corresponding Promise is pending.
            // This means that the Promise can still become resolved or rejected depending on the atom's actions.

            myAtom$.unset(); // reset

            promise = myAtom$.toPromise();
            myAtom$.setError('Error.');

            /**
             * ** Your Turn **
             * We set the atom to an error state. The promise should now be rejected, hence we wrap it in a `try-catch` block.
             * What do you think the error message will be? Remember that `try-catch` is not a custom-defined structure.
             */
            try {
                await promise;
            } catch (error: any) {
                // `.toBe('Error.')`  or  `.not.toBe('Error.')`? ↴
                expect(error.message) /*__YOUR_TURN__*/; // #QUESTION
                expect(error.message).not.toBe('Error.'); // #ANSWER
            }

            myAtom$.set('no more error');
            const myDerivable$ = myAtom$.derive(() => {
                throw new Error('Error.');
            });
            promise = myDerivable$.toPromise();

            /**
             * ** Your Turn **
             * We now let `myDerivable$` derive from `myAtom$`, which will throw a normal error (not a custom Sherlock error).
             * What will the error message be this time?
             */
            try {
                await promise;
            } catch (error: any) {
                // `.toBe('Error.')`  or  `.not.toBe('Error.')`? ↴
                expect(error.message) /*__YOUR_TURN__*/; // #QUESTION
                expect(error.message).toBe('Error.'); // #ANSWER
            }
        });

        /**
         * Some reactive libraries already existed, such as RxJS.
         * Angular uses RxJS, and since we use Angular, we are forced to use RxJS.
         * However, RxJS becomes more and more complicated and user-unfriendly
         * as your application becomes bigger. This was the main reason why
         * Sherlock was developed.
         * As Angular uses RxJS, our Sherlock library needs to be compatible with it.
         * The `fromObservable()` and `toObservable()` functions are used for this.
         */
        it('`fromObservable()`', () => {
            /**
             * RxJS uses `Observables` which are similar to our `Derivables`.
             * It also uses the concept of `Subscribing`, which is similar to `Deriving`.
             *
             * Here's an example of the similarities and differences.
             */

            const dummyObservable = new Subject<number>(); // `Subject` is a form of `Observable`
            let subscribedToDummy;
            dummyObservable.subscribe({ next: x => (subscribedToDummy = x) });
            dummyObservable.next(2);
            expect(subscribedToDummy).toBe(2);

            const dummyDerivable$ = new Atom<number>(1);
            const derivedOfDummy = dummyDerivable$.derive(x => x);
            dummyDerivable$.set(2);
            expect(derivedOfDummy.value).toBe(2);

            /**
             * The code for turning an Observable "observable" into a derivable "value$" is
             * like this (from libs/sherlock-utils/src/lib/from-observable.ts):
             *
             * ```
             * observable.subscribe({
             *   next: value => value$.set(value),
             *   error: err => value$.setFinal(error(err)),
             *   complete: () => value$.makeFinal(),
             * });
             * return () => subscription.unsubscribe();
             * ```
             *
             * Essentially,
             * - we map `next()` (Observable) to `set()` (Derivable);
             * - we map `error()` (Observable) to `setFinal(error())` (Derivable);
             * NOTE: we don't map it to `setError()` as we would then be able to undo the error state. We can't undo it when it's final.
             * - we map`complete()` (Observable) to `makeFinal()` (Derivable);
             * - and we return a function we can call to stop (similar to using `react()`), which is mapped to `unsubscribe()`
             * NOTE: in fact, `fromEventPattern()` is build using the `react()` function!
             *
             * Okay, that's enough info for now. Let's get to work.
             * The `fromObservable()` function translates an `Observable` to a `Derivable`.
             *
             * ** Your Turn **
             *
             * Use `fromObservable()` to turn this `Observable` into a `Derivable`.
             */

            // A `Subject` is the simplest form of `Observable`: it is comparable to our `Atom`.
            const myObservable = new Subject<number>();

            const myDerivable$: Derivable<number> = __YOUR_TURN__; // #QUESTION
            const myDerivable$: Derivable<number> = fromObservable(myObservable); // #ANSWER
            const reactor = jest.fn();
            const onError = jest.fn();
            myDerivable$.react(reactor, { onError });

            myObservable.next(1);
            expect(myDerivable$.value).toBe(1);

            myObservable.next(2);
            expect(myDerivable$.value).toBe(2);

            myObservable.error('OH NO!');
            expect(myDerivable$.error).toBe('OH NO!');

            myObservable.next(3);
            expect(myDerivable$.value).toBe(undefined);
            // It is set to final, so after an error has been thrown, you cannot undo it.

            /**
             * The `toObservable()` function has become obsolete as RxJS already contains a function
             * called `from()` that can parse `Derivables` to `Observables`. Note that a `from` from
             * the side of RxJS is the same as a `to` from the side of Sherlock.
             *
             * ** Your Turn **
             *
             * Use the `from()` function to turn this `Derivable` into an `Observable`.
             */
            const myDerivable2$ = atom(1);

            const myObservable2: Observable<number> = __YOUR_TURN__; // #QUESTION
            const myObservable2: Observable<number> = from(myDerivable2$); // #ANSWER

            let value = 0;
            myObservable2.subscribe({ next: x => (value = x) });

            expect(value).toBe(1); // immediate call to `next()`

            myDerivable2$.set(2);
            expect(value).toBe(2);
        });

        /**
         * The `fromObservable()` function can be used to turn `Observables` into `Derivables`. Under the hood,
         * this function uses the `fromEventPattern()` function which is capable of turning any abstract pattern
         * into a `Derivable`. Let's see how that works.
         */
        it('`fromEventPattern`', async () => {
            /**
             * The basic idea is that you get a stream of inputs, and want to map that stream to a Derivable stream.
             * This means that, whenever an update comes from the input-stream, this update is also given to a Derivable,
             * which can then be `derive`d and `react`ed to.
             *
             * For example, you may get a function which, instead of returning an output, passes some output to your own chosen
             * `callback` function. For example, this code 'heyifies' your input, adding "hey" in front of it.
             * It then passes this heyified output to the callback function. As seen before in `react()` and `fromObservable()`,
             * these functions like `heyify()` typically return a stopping function, which can be called to stop the heyification.
             */
            function heyify(names: string[], callback: (something: string) => void) {
                let i = 0;
                // every 100ms, call the callback function
                const int = setInterval(() => callback(`Hey ${names[i++]}`), 100);
                // when this function is called, `clearInterval()` stops the stream.
                return () => clearInterval(int);
            }

            /**
             * Now, we want to turn this process into a Derivable, where updates that are send to the callback are passed to the Derivable as well.
             * This way, we can use our cool Derivable functions like `derive()` or `react()` to process changes to this Derivable
             * (= new outputs from the callback).
             *
             * `fromEventPattern()` looks more complex than it is. This function sets a Derivable in place of the callback and also returns
             * a stopping function, which can be reused from the `heyify()` function.
             */
            function heyify$(names: string[]): Derivable<string> {
                return fromEventPattern<string>(v$ => {
                    // the callback now sets a derivable.
                    const stop = heyify(names, something => v$.set(something));
                    // and the stopping function is returned.
                    return stop;
                });
            }

            /**
             * This Derivable can now be reacted to.
             * When this Derivable gets connected (reacted to, in this case), the function within the `fromEventPattern()` triggers.
             * Upon connection, a fresh atom is passed to this function, which is then `set()` in the callback function of `heyify()`.
             * This atom "lives" in the body of the callback function and is only changed when a new value is passed to the callback function.
             * Here, this is a new "Hey {name}" message, every 100ms.
             */

            // To test this, we need to make sure time elapses only when we want it to. So we temporarily stop time, no big deal.
            // (Don't worry about what the internet says about the dangers of stopping time: this is perfectly safe.)
            jest.useFakeTimers();

            let value: string = '';
            const stop = heyify$(['Bob', 'Jan', 'Hans', 'Roos']).react(v => (value = v));

            /**
             * ** Your Turn **
             *
             * What do you expect `value` to be?
             * *Hint: At the start, time has not yet passed, and `setInterval()` only responds after the first 100ms.*
             */
            expect(value).toBe(__YOUR_TURN__); // #QUESTION
            expect(value).toBe(''); // #ANSWER

            // We manually move time by 100ms, which is exactly the time that the `heyify()` function needs to call the `callback()` again.
            jest.advanceTimersByTime(100);
            expect(value).toBe(__YOUR_TURN__); // #QUESTION
            expect(value).toBe('Hey Bob'); // #ANSWER

            jest.advanceTimersByTime(100);
            expect(value).toBe(__YOUR_TURN__); // #QUESTION
            expect(value).toBe('Hey Jan'); // #ANSWER

            jest.advanceTimersByTime(100);
            expect(value).toBe(__YOUR_TURN__); // #QUESTION
            expect(value).toBe('Hey Hans'); // #ANSWER

            stop();

            // After stopping, the Derivable no longer responds to updates - it is essentially final.
            jest.advanceTimersByTime(100);
            expect(value).toBe(__YOUR_TURN__); // #QUESTION
            expect(value).toBe('Hey Hans'); // #ANSWER
        });
    });
});
