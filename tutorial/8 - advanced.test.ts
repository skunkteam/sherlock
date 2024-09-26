import { atom, constant, Derivable, derive, SettableDerivable } from '@skunkteam/sherlock';
import { Map as ImmutableMap } from 'immutable';

/**
 * ** Your Turn **
 *
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;

describe('advanced', () => {
    /**
     * In the case a `Derivable` is required, but the value is immutable.
     * You can use a `constant()`.
     *
     * This will create a readonly `Derivable`.
     */
    it('`constant`', () => {
        /**
         * We cast to `SettableDerivable` to trick TypeScript for this test.
         * It can be valueable to know what a `constant()` is, though.
         * So try and remove the `cast`, see what happens!
         */
        const c = constant('value') as unknown as SettableDerivable<string>;

        /**
         * ** Your Turn **
         *
         * What do you expect this `Derivable` to do on `.set()`, `.get()` etc?
         */

        // .toThrow() or .not.toThrow()? ↴ (2x)
        expect(() => c.get()).not.toThrow();
        expect(() => c.set('new value')).toThrow();
    });

    /**
     * Collections in `ImmutableJS` are immutable, so any modification to a
     * collection will create a new one. This results in every change needing a
     * `.get()` and a `.set()` on a `Derivable`.
     *
     * To make this pattern a little bit easier, the `.swap()` method can be
     * used. The given function will get the current value of the `Derivable`
     * and any return value will be set as the new value.
     */
    it('`.swap()`', () => {
        // This is a separate function because you might want to use this later.
        function plusOne(num: number) {
            return num + 1;
        }

        const myCounter$ = atom(0);
        /**
         * ** Your Turn **
         *
         * Rewrite the `.get()`/`.set()` combos below using `.swap()`.
         */

        myCounter$.swap(plusOne);
        expect(myCounter$.get()).toEqual(1);

        myCounter$.swap(plusOne);
        expect(myCounter$.get()).toEqual(2);
    });

    /**
     * As an alternative to `.get()` and `.set()`, there is also the `.value`
     * accessor.
     */
    describe('.value', () => {
        /**
         * `.value` can be used as an alternative to `.get()` and `.set()`.
         * This helps when a property is expected instead of two methods.
         */
        it('as a getter/setter', () => {
            const myAtom$ = atom('foo');

            /**
             * ** Your Turn **
             *
             * Use the `.value` accessor to get the current value.
             */
            expect(myAtom$.value).toEqual('foo');

            /**
             * ** Your Turn **
             *
             * Now use the `.value` accessor to set a 'new value'.
             */
            myAtom$.value = 'new value';

            expect(myAtom$.get()).toEqual('new value');
        });

        /**
         * If a `Derivable` is `unresolved`, `.get()` will normally throw.
         * `.value` will return `undefined` instead.
         */
        it('will not throw when `unresolved`', () => {
            const myAtom$ = atom.unresolved<string>();

            /**
             * ** Your Turn **
             */
            expect(myAtom$.value).toEqual(undefined);
        });

        /**
         * As a result, if `.value` is used inside a derivation, it will also
         * replace `unresolved` with `undefined`. So `unresolved` will not
         * automatically propagate when using `.value`.
         */
        it('will stop propagation of `unresolved` in `.derive()`', () => {
            const myAtom$ = atom('foo');

            const usingGet$ = derive(() => myAtom$.get());
            const usingVal$ = derive(() => myAtom$.value);

            expect(usingGet$.get()).toEqual('foo');
            expect(usingVal$.get()).toEqual('foo');

            /**
             * ** Your Turn **
             *
             * We just created two `Derivable`s that are almost exactly the same.
             * But what happens when their source becomes `unresolved`?
             */
            expect(usingGet$.resolved).toEqual(true);
            expect(usingVal$.resolved).toEqual(true);
            myAtom$.unset();
            expect(usingGet$.resolved).toEqual(false);
            expect(usingVal$.resolved).toEqual(true);
        });
    });

    /**
     * The `.map()` method is comparable to `.derive()`.
     * But there are a couple of differences:
     * - It only triggers when the source `Derivable` changes
     * - It does not track any other `Derivable` used in the function
     * - It can be made to be settable
     */
    describe('`.map()`', () => {
        const mapReactSpy = jest.fn();
        // Clear the spy before each test case.
        beforeEach(() => mapReactSpy.mockClear());

        it('triggers when the source changes', () => {
            const myAtom$ = atom(1);
            /**
             * ** Your Turn **
             *
             * Use the `.map()` method to create the expected output below
             */
            const mappedAtom$: Derivable<string> = myAtom$.map(value => value.toString().repeat(value));

            mappedAtom$.react(mapReactSpy);

            expect(mapReactSpy).toHaveBeenCalledExactlyOnceWith('1', expect.toBeFunction());

            myAtom$.set(3);

            expect(mapReactSpy).toHaveBeenCalledTimes(2);
            expect(mapReactSpy).toHaveBeenLastCalledWith('333', expect.toBeFunction());
        });

        it('does not trigger when any other `Derivable` changes', () => {
            const myRepeat$ = atom(1);
            const myString$ = atom('ho');
            const deriveReactSpy = jest.fn();

            // Note that the `.map` uses both `myRepeat$` and `myString$`
            myRepeat$.map(r => myString$.get().repeat(r)).react(mapReactSpy);
            myRepeat$.derive(r => myString$.get().repeat(r)).react(deriveReactSpy);

            expect(mapReactSpy).toHaveBeenCalledExactlyOnceWith('ho', expect.toBeFunction());
            expect(deriveReactSpy).toHaveBeenCalledExactlyOnceWith('ho', expect.toBeFunction());

            myRepeat$.value = 3;
            /**
             * ** Your Turn **
             *
             * We changed`myRepeat$` to equal 3.
             * Do you expect both reactors to have fired? And with what?
             */
            expect(deriveReactSpy).toHaveBeenCalledTimes(2);
            expect(deriveReactSpy).toHaveBeenLastCalledWith('hohoho', expect.toBeFunction());

            expect(mapReactSpy).toHaveBeenCalledTimes(2);
            expect(mapReactSpy).toHaveBeenLastCalledWith('hohoho', expect.toBeFunction());

            myString$.value = 'ha';
            /**
             * ** Your Turn **
             *
             * And now that we have changed `myString$`? And when `myRepeat$` changed again?
             */
            expect(deriveReactSpy).toHaveBeenCalledTimes(3);
            expect(deriveReactSpy).toHaveBeenLastCalledWith('hahaha', expect.toBeFunction());

            expect(mapReactSpy).toHaveBeenCalledTimes(2);
            expect(mapReactSpy).toHaveBeenLastCalledWith('hohoho', expect.toBeFunction());

            myRepeat$.value = 2;
            expect(deriveReactSpy).toHaveBeenCalledTimes(4);
            expect(deriveReactSpy).toHaveBeenLastCalledWith('haha', expect.toBeFunction());

            expect(mapReactSpy).toHaveBeenCalledTimes(3);
            expect(mapReactSpy).toHaveBeenLastCalledWith('haha', expect.toBeFunction());

            /**
             * As you can see, a change in `myString$` will not trigger an
             * update. But if an update is triggered, `myString$` will be called
             * and the new value will be used.
             */
        });

        /**
         * Since `.map()` is a relatively simple mapping of input value to
         * output value. It can often be reversed. In that case you can use that
         * reverse mapping to create a `SettableDerivable`.
         */
        it('can be settable', () => {
            const myAtom$ = atom(1);

            /**
             * ** Your Turn **
             *
             * Check the comments and `expect`s below to see what should be
             * implemented exactly.
             */
            const myInverse$ = myAtom$.map(
                // This first function is called when getting...
                n => -n,
                // ...and this second function is called when setting.
                n => -n,
            );

            // The original `atom` was set to 1, so we want the inverse to
            // be equal -1.
            expect(myInverse$.get()).toEqual(-1);

            // Now we set the inverse to -2 directly, so we expect the original
            // `atom` to be equal to 2.
            myInverse$.set(-2);
            expect(myAtom$.get()).toEqual(2);
            expect(myInverse$.get()).toEqual(-2);
        });
    });

    /**
     * `.pluck()` is a special case of the `.map()` method.
     * If a collection of values, like an Object, Map, Array is the result of a
     * `Derivable` one of those values can be plucked into a new `Derivable`.
     * This plucked `Derivable` can be settable, if the source supports it.
     *
     * The way properties are plucked is pluggable, but by default both
     * `<source>.get(<prop>)` and `<source>[<prop>]` are supported to support
     * basic Objects, Maps and Arrays.
     *
     * *Note that normally when a value of a collection changes, the reference
     * does not. This means that setting a plucked property of a regular
     * Object/Array/Map will not cause any reaction on that source `Derivable`.
     *
     * ImmutableJS can help fix this problem*
     */
    describe('`.pluck()`', () => {
        const reactSpy = jest.fn();
        const reactPropSpy = jest.fn();
        let myMap$: SettableDerivable<ImmutableMap<string, string>>;
        let firstProp$: SettableDerivable<string>;

        // Reset
        beforeEach(() => {
            reactPropSpy.mockClear();
            reactSpy.mockClear();
            myMap$ = atom<ImmutableMap<string, string>>(
                ImmutableMap({
                    firstProp: 'firstValue',
                    secondProp: 'secondValue',
                }),
            );
            /**
             * ** Your Turn **
             *
             * `.pluck()` 'firstProp' from `myMap$`.
             *
             * * Hint: you'll have to cast the result from `.pluck()`.
             */
            firstProp$ = myMap$.pluck('firstProp') as SettableDerivable<string>;
        });

        /**
         * Once a property is plucked in a new `Derivable`. This `Derivable` can
         * be used as a regular `Derivable`.
         */
        it('can be used as a normal `Derivable`', () => {
            firstProp$.react(reactPropSpy, { skipFirst: true });

            /**
             * ** Your Turn **
             *
             * What do you expect the plucked `Derivable` to look like? And what
             * happens when we `.set()` it?
             */
            expect(firstProp$.get()).toEqual('firstValue');

            // the plucked `Derivable` should be settable
            firstProp$.set('other value');
            // is the `Derivable` value the same as was set?
            expect(firstProp$.get()).toEqual('other value');

            // How many times was the spy called? Note the `skipFirst`..
            expect(reactPropSpy).toHaveBeenCalledTimes(1);

            // ...and what was the value?
            expect(reactPropSpy).toHaveBeenLastCalledWith('other value', expect.toBeFunction());
        });

        /**
         * If the source of the plucked `Derivable` changes, the plucked
         * `Derivable` will change as well. As long as the change affects the
         * plucked property of course.
         */
        it('will react to changes in the source `Derivable`', () => {
            firstProp$.react(reactPropSpy, { skipFirst: true });

            /**
             * ** Your Turn **
             *
             * We will set `secondProp`, will this affect `firstProp$`?
             *
             * *Note: this `map` refers to `ImmutableMap`, not to the
             * `Derivable.map()` we saw earlier in the tutorial.*
             */
            myMap$.swap(map => map.set('secondProp', 'new value'));

            // How many times was the spy called? Note the `skipFirst`.
            expect(reactPropSpy).toHaveBeenCalledTimes(0);

            /**
             * ** Your Turn **
             *
             * And what if we set `firstProp`?
             */
            myMap$.swap(map => map.set('firstProp', 'new value'));

            // How many times was the spy called? Note the `skipFirst`..
            expect(reactPropSpy).toHaveBeenCalledTimes(1);

            // ...and what was the value?
            expect(reactPropSpy).toHaveBeenLastCalledWith('new value', expect.toBeFunction());
        });

        /**
         * Before, we saw how a change in the source of the plucked `Derivable`
         * propagates to it. Now the question is: does this go the other way
         * too?
         *
         * We saw that we can `.set()` the value of the plucked `Derivable`, so
         * what happens to the source if we do that?
         */
        it('will write through to the source `Derivable`', () => {
            myMap$.react(reactSpy, { skipFirst: true });

            /**
             * ** Your Turn **
             *
             * So what if we set `firstProp$`? Does this propagate to the source
             * `Derivable`?
             */
            firstProp$.set('mysterious');
            expect(reactSpy).toHaveBeenCalledTimes(1);
            expect(myMap$.get().get('firstProp')).toEqual('mysterious');
            expect(myMap$.get().get('secondProp')).toEqual('secondValue');
        });
    });
});
