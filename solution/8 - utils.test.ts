import { atom, constant, derive, FinalWrapper } from '@skunkteam/sherlock';
import { fromPromise, lift, pairwise, peek, scan, struct } from '@skunkteam/sherlock-utils';

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
        myCounter$.derive(pairwise((newVal, oldVal) => newVal - oldVal, 0)).react(reactSpy); 

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
        expect(reactSpy).toHaveBeenLastCalledWith(10, expect.toBeFunction()); // 20 (current value of `myCounter$`) - 10 (previous value of `myCounter$`) 
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
        myCounter$.derive(scan((acc, val) => val - acc, 0)).react(reactSpy); 

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
        expect(reactSpy).toHaveBeenLastCalledWith(12, expect.toBeFunction()); // 20 (current value of `myCounter$`) - 8 (previous returned value) 
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
        myList2 = myList.map(pairwise((newV, oldV) => newV - oldV, 0)); 
        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);

        // However, we should be careful with this, as this does not always behave as intended.
        // Particularly, what exactly happens when we do call `pairwise()` using a lambda function?
        myList2 = myList.map(v => pairwise((newV, oldV) => newV - oldV, 0)(v)); // copy the same implementation here 
        expect(myList2).toMatchObject([1, 2, 3, 5, 10]);

        // Even if we are more clear about what we pass, this unintended behavior does not go away.
        myList2 = myList.map((v, _, _2) => pairwise((newV, oldV) => newV - oldV, 0)(v)); // copy the same implementation here 
        expect(myList2).toMatchObject([1, 2, 3, 5, 10]);

        // `pairwise()` keeps track of the previous value under the hood. Using a lambda of
        // the form `v => pairwise(...)(v)` would create a new `pairwise` function every call,
        // essentially resetting the previous value every call. And resetting the previous value
        // to 0 causes the input to stay the same (after all: x - 0 = x).
        // Other than by not using a lambda function, we can fix this by
        // saving the `pairwise` in a variable and reusing it for every call.

        let f = pairwise((newV, oldV) => newV - oldV, 0); 
        myList2 = myList.map(v => f(v));
        expect(myList2).toMatchObject([1, 1, 1, 2, 5]);

        // To get more insight in the `pairwise()` function, you can call it
        // manually. Here, we show what happens under the hood.

        f = pairwise((newV, oldV) => newV - oldV, 0); 

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
        f = pairwise((newV, oldV) => newV - oldV, 0); 
        myList2 = myList.filter(v => f(v) === 1); 

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
        let f: (v: number) => number = scan((acc, val) => val - acc, 0); 
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
        f = scan((acc, val) => val + acc, 0); 
        myList2 = myList.filter(v => f(v) >= 8); 

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
        reactSpy = jest.fn(pairwise((newV, oldV) => newV - oldV, 0)); 
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

        reactSpy = jest.fn(scan((acc, val) => val - acc, 0)); 
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
        expect(myOneAtom$.get()).toEqual({
            regularProp: 'new value',
            string: 'my string',
            number: 1,
            sub: {
                string: 'my new substring',
            },
        });
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
            const isEvenDerivable = lift(isEvenNumber); 

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
            myMappedDerivable$ = lift(addOne)(myAtom$); 

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
        derive(() => myTrackedAtom$.get() + peek(myUntrackedAtom$)).react(reactor); 

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

            // TODO: SHOW THAT CONST ALSO GIVES THE SAME ERROR MESSAGE WHEN SET!!

            // You can make an atom final using the `.makeFinal()` function.
            myAtom$.makeFinal();
            expect(myAtom$.final).toBeTrue();

            /**
             * ** Your Turn **
             * What do you think will happen when we try to `.get()` or `.set()` this atom?
             */
            // .toThrow() or .not.toThrow()? ↴
            expect(() => myAtom$.get()).not.toThrow(); 
            expect(() => myAtom$.set(2)).toThrow('cannot set a final derivable'); 

            // This behavior is consistent with normal variables created using `const`.
            // Alternatively, you can set a last value before setting it to `final`, using `.setFinal()`.
            // .toThrow() or .not.toThrow()? ↴
            expect(() => myAtom$.setFinal(2)).toThrow('cannot set a final derivable'); 
            // Remember: we try to set an atom that is already final, so we get an error 

            // There is no way to 'unfinalize' a Derivable, so the only solution to reset is to
            // create a whole new Derivable.
            myAtom$ = atom(1);
            myAtom$.setFinal(2);
            expect(myAtom$.final).toBeTrue();

            // Also interesting: a `constant` as introduced in tutorial 7 is actually a Derivable set to
            // `final` in disguise. You can verify this by checking the implementation of `constant` at
            // libs/sherlock/src/lib/derivable/factories.ts:39
            const myConstantAtom$ = constant(1);
            expect(myConstantAtom$.final).toBe(true); 
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
            expect(myDerivable$.final).toBe(true); 
            expect(myDerivable$.connected).toBe(false); 

            /**
             * Derivables that are final (or constant) are no longer tracked. This can save
             * a lot of memory and time by cleaning up unused data. Also, when all the variables
             * that a Derivable depends on become final, that Derivable itself becomes final too.
             * This chains similarly to `unresolved` and `error`.
             */
        });

        it('TODO: `final` State', () => {
            /** A property such as `.final`, similar to variables like `.errored` and `.resolved`
             * is useful for checking whenever a Derivable is in a certain state, but these properties
             * are just a boolean. This means that these properties cannot be derived and we cannot
             * have certain functions execute whenever there is a change in the state. For this reason,
             * every Derivable holds an internal state, retrievable using `.getState()` which can be
             * derived. TODO: Have a clear place where I explain this! Now I have info up top here too.
             *
             * We have seen that states (`State<V>`) can be `undefined`, `ErrorWrapper`,
             * or any regular type `V`. Other states exist, such as the `MaybeFinalState<V>`. This state can be either
             * a normal state `State<V>` or a special `FinalWrapper<State<V>>` state. Let's see that in action.
             */
            expect(myAtom$.getMaybeFinalState()).toBe(1); // `getMaybeFinalState` can return a normal state, which in turn can be any normal type.

            myAtom$.makeFinal();

            expect(myAtom$.getMaybeFinalState()).toBeInstanceOf(FinalWrapper); // but `getMaybeFinalState` can also return a `FinalWrapper` type.
            expect(myAtom$.getState()).toBe(1); // the normal type is still the final it contains.

            // TODO: MAAR JE KAN EEN STATE HELEMAAL NIET DERIVEN!
            // Dus dat is allemaal onzin lijkt me....??? Bovendien, kan je normale variabelen niet deriven door het gewoon te
            // wrappen in een atom ofzo? Of door te structen?
        });
    });

    describe('`Promise`, `Observable`, and `EventPattern`', () => {
        /**
         * Sherlock can also deal with Promises using the `.fromPromise()` and `.toPromise()` functions.
         * This translates Promises directly to Sherlock concepts we have discussed already.
         */
        it('`fromPromise()`', async () => {
            // we initialize a Promise that will resolve, not reject, when handled
            let promise = Promise.resolve(15);
            let myAtom$ = fromPromise(promise);

            /**
             * ** Your Turn **
             * What do you think is the default state of an atom based on a Promise?
             */
            expect(myAtom$.resolved).toBe(false); 
            expect(myAtom$.final).toBe(false); 

            // Now we wait for the Promise to be handled (resolved).
            await promise;

            /**
             * ** Your Turn **
             * So, what will happen to `myAtom$` and `myMappedAtom$`?
             */
            expect(myAtom$.get()).toBe(15); 
            expect(myAtom$.final).toBe(true); 

            // Now we make a promise that is rejected when called.
            promise = Promise.reject('Oh no, I messed up!');
            myAtom$ = fromPromise(promise);

            // We cannot await the Promise itself, as it would immediately throw.
            await Promise.resolve();

            /**
             * ** Your Turn **
             * So, what will happen to `myAtom$` now?
             */
            expect(myAtom$.errored).toBe(true); 
            expect(myAtom$.error).toBe('Oh no, I messed up!'); 
            expect(myAtom$.final).toBe(true); 
        });

        it('`.toPromise()`', async () => {
            /**
             * `.toPromise()` returns a promise that is linked to the atom it is based on (`myAtom$` here)
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
            expect(await promise).toBe('initial value'); // `myAtom$` starts with a value ('initial value'), so the promise is immediately resolved 

            myAtom$.unset();
            promise = myAtom$.toPromise();

            /**
             * ** Your Turn **
             * We set the atom to `unresolved`. What will now happen when we try to set the atom with a value?
             */
            myAtom$.set('third value');
            expect(await promise).toBe('third value'); // This is now the first value the atom obtains since the promise was created. 

            // Whenever an atom is in an `unresolved` state, the corresponding Promise is pending.
            // This means that the Promise can still become resolved or rejected depending on the atom's actions.

            myAtom$.unset();
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
                expect(error.message).not.toBe('Error.'); 
            }

            myAtom$.set('no more error');
            const myDerivable$ = myAtom$.derive(() => {
                throw new Error('Error.');
            });
            promise = myDerivable$.toPromise();

            /**
             * ** Your Turn **
             * We now let `myDerivable$` derive from `myAtom$`, and it will throw a normal error (not a custom Sherlock error).
             * What will the error message be this time?
             */
            try {
                await promise;
            } catch (error: any) {
                // `.toBe('Error.')`  or  `.not.toBe('Error.')`? ↴
                expect(error.message).toBe('Error.'); 
            }
        });

        it('`fromObservable()`', () => {
            // Has to do with SUBSCRIBING. Hasn't been discussed either...
            // TODO: "As all Derivables are now compatible with rxjs's `from` function,
            // we no longer need the `toObservable` function from `@skunkteam/sherlock-rxjs`."
        });

        it('`fromEventPattern`', () => {
            // TODO: this is kinda complicated shit... Requires explaining a lot of extra stuff (Subjects, Subscribing, Observables...). Leave for now?
        });
    });
});
