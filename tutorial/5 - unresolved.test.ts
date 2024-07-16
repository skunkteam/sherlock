import { atom, Derivable, DerivableAtom } from '@skunkteam/sherlock';

/**
 * ** Your Turn **
 *
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;

/**
 * Sometimes your data isn't available yet. For example if it is still being
 * fetched from the server. At that point you probably still want your
 * `Derivable` to exist, to start deriving and reacting when the data becomes
 * available.
 *
 * To support this, `Derivable`s in `@skunkteam/sherlock` support a separate
 * state, called `unresolved`. This indicates that the data is not available
 * yet, but (probably) will be at some point.
 */
describe('unresolved', () => {
    /**
     * Let's start by creating an `unresolved` `Derivable`.
     */
    it('can be checked on the `Derivable`', () => {
        // By using the `.unresolved()` method, you can create an `unresolved`
        // atom. Note that you will need to indicate the type of this atom,
        // since it can't be inferred by TypeScript this way.
        const myAtom$ = atom.unresolved<number>();

        expect(myAtom$.resolved).toEqual(false);

        /**
         * ** Your Turn **
         *
         * Resolve the atom, it's pretty easy
         */
        myAtom$.set(1);

        expect(myAtom$.resolved).toBeTrue();
    });

    /**
     * An `unresolved` `Derivable` is not able to provide a value yet.
     * So `.get()` will throw if you try.
     */
    it('cannot `.get()`', () => {
        /**
         * ** Your Turn **
         *
         * Time to create an `unresolved` Atom..
         */
        const myAtom$: DerivableAtom<string> = atom.unresolved();

        expect(myAtom$.resolved).toBeFalse();

        // By this test passing, we see that `.get()` on an unresolved
        // `Derivable` indeed throws an error.
        expect(() => myAtom$.get()).toThrow('Could not get value, derivable is unresolved');

        myAtom$.set('finally!');

        /**
         * ** Your Turn **
         *
         * What do you expect?
         */
        expect(myAtom$.resolved).toEqual(true);

        // .toThrow() or .not.toThrow()? ↴
        expect(() => myAtom$.get()).not.toThrow();
    });

    /**
     * If a `Derivable` is `unresolved` it can't react yet. But it will
     * `.react()` if a value becomes available.
     *
     * *Note that this can prevent `.react()` from executing immediately* // TODO: what annoying messages... I want to change them.
     * It is not a 'Note: side-effect' but the expected intended behavior!
     */
    it('reacting to `unresolved`', () => {
        const myAtom$ = atom.unresolved<string>();

        const hasReacted = jest.fn();
        myAtom$.react(hasReacted);

        /**
         * ** Your Turn **
         *
         * What do you expect?
         */
        expect(hasReacted).toHaveBeenCalledTimes(0);

        /**
         * ** Your Turn **
         *
         * Now make the last expect succeed
         */
        myAtom$.set(`woohoow, I was called`);

        expect(myAtom$.resolved).toBeTrue();
        expect(hasReacted).toHaveBeenCalledExactlyOnceWith(`woohoow, I was called`, expect.toBeFunction());
    });

    /**
     * In `@skunkteam/sherlock` there is no reason why a `Derivable` should not
     * be able to become `unresolved` again after it has been set.
     */
    it('can become `unresolved` again', () => {
        const myAtom$ = atom.unresolved<string>();

        expect(myAtom$.resolved).toBeFalse();

        /**
         * ** Your Turn **
         *
         * Set the value..
         */
        myAtom$.set(`it's alive!`);

        expect(myAtom$.get()).toEqual(`it's alive!`);

        /**
         * ** Your Turn **
         *
         * Unset the value.. (*Hint: TypeScript is your friend*)
         */
        myAtom$.unset();

        expect(myAtom$.resolved).toBeFalse();
    });

    /**
     * When a `Derivable` is dependent on another `unresolved` `Derivable`, this
     * `Derivable` should also become `unresolved`.
     *
     * *Note that this will only become `unresolved` when there is an active
     * dependency (see 'inner workings#dynamic dependencies')*
     */
    it('will propagate', () => {
        const myString$ = atom.unresolved<string>();
        const myOtherString$ = atom.unresolved<string>();

        /**
         * ** Your Turn **
         *
         * Combine the two `Atom`s into one `Derivable`
         */
        const myDerivable$: Derivable<string> = myString$.derive(s => s + myOtherString$.get());

        /**
         * ** Your Turn **
         *
         * Is `myDerivable$` expected to be `resolved`?
         */
        expect(myDerivable$.resolved).toEqual(false);

        // Now let's set one of the two source `Atom`s
        myString$.set('some');

        /**
         * ** Your Turn **
         *
         * What do you expect to see in `myDerivable$`.
         */
        expect(myDerivable$.resolved).toEqual(false);

        // And what if we set `myOtherString$`?
        myOtherString$.set('data');
        expect(myDerivable$.resolved).toEqual(true);
        expect(myDerivable$.get()).toEqual('somedata');

        /**
         * ** Your Turn **
         *
         * Now we will unset one of the `Atom`s.
         * What do you expect `myDerivable$` to be?
         */
        myString$.unset();
        expect(myDerivable$.resolved).toEqual(false);
    });
});
