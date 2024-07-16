import { atom } from '@skunkteam/sherlock';
import { Seq } from 'immutable';

/**
 * ** Your Turn **
 *
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;

/**
 * Time to dive a bit deeper into the inner workings of `@skunkteam/sherlock`.
 */
describe('inner workings', () => {
    /**
     * What if there is a derivation that reads from one of two `Derivable`s
     * dynamically? Will both of those `Derivable`s be tracked for changes?
     */
    it('dynamic/inactive dependencies', () => {
        const switch$ = atom(true);
        const number$ = atom(1);
        const string$ = atom('one');

        const reacted = jest.fn();

        switch$
            // This `.derive()` is the one we are testing when true, it will
            // return the `number` otherwise the `string`
            .derive(s => (s ? number$.get() : string$.get()))
            .react(reacted);

        // The first time should not surprise anyone, the derivation
        // was called and returned the right result.
        expect(reacted).toHaveBeenCalledExactlyOnceWith(1, expect.toBeFunction());
        // Note here the second expectation `.toBeFunction()` to
        // catch the stop function that was part of the .react() signature.

        // `switch$` is still set to true (number)
        string$.set('two');

        /**
         * ** Your Turn **
         *
         * What do you expect?
         */
        expect(reacted).toHaveBeenCalledTimes(1);
        expect(reacted).toHaveBeenLastCalledWith(1, expect.toBeFunction()); // TODO: NIET omdat hij weet dat de string niets verandert,
        // maar juist omdat hij dezelfde waarde binnen krijgt en dus niet nogmaals triggered!!

        // `switch$` is still set to true (number)
        number$.set(2);

        /**
         * ** Your Turn **
         *
         * What do you expect?
         */
        expect(reacted).toHaveBeenCalledTimes(2);
        expect(reacted).toHaveBeenLastCalledWith(2, expect.toBeFunction()); // Now it gets a different value!!

        // Now let's reset the mock function, so the call count should
        // be 0 again.
        reacted.mockClear();
        expect(reacted).toHaveBeenCalledTimes(0);

        // `switch$` is set to false (string)
        switch$.set(false);
        number$.set(3);

        /**
         * ** Your Turn **
         *
         * What do you expect now?
         */
        expect(reacted).toHaveBeenCalledTimes(1);
        expect(reacted).toHaveBeenLastCalledWith('two', expect.toBeFunction()); // It gets a different value than last time again. No need for the reset...? TODO:
    });

    /**
     * One thing to know about `Derivable`s is that derivations are not
     * executed, until someone asks.
     *
     * So let's test this.
     */
    it('lazy execution', () => {
        const hasDerived = jest.fn();

        const myAtom$ = atom(true);
        const myDerivation$ = myAtom$.derive(hasDerived); // NOTE: React causes an immediate update. Derive does not!

        /**
         * ** Your Turn **
         *
         * We have created a new `Derivable` by deriving the `Atom`. But have
         * not called `.get()` on that new `Derivable`.
         *
         * How many times do you think the `hasDerived` function has been
         * called? 0 is also an option of course.
         */

        // Well, what do you expect?
        expect(hasDerived).toHaveBeenCalledTimes(0);

        myDerivation$.get();

        // And after a `.get()`?
        expect(hasDerived).toHaveBeenCalledTimes(1);

        myDerivation$.get();

        // And after the second `.get()`? Is there an extra call?
        expect(hasDerived).toHaveBeenCalledTimes(2);

        /**
         * The state of any `Derivable` can change at any moment.
         *
         * But you don't want to keep a record of the state and changes to a
         * `Derivable` that no one is listening to.
         *
         * That's why a `Derivable` has to recalculate it's internal state every
         * time `.get()` is called.
         */
    });

    /**
     * So what if the `Derivable` is reacting?
     *
     * When a `Derivable` is reacting, the current state is known.
     *
     * And since changes are derived/reacted to synchronously, the state is
     * always up to date.
     *
     * So a `.get()` should not have to be calculated.
     */
    it('while reacting', () => {
        const hasDerived = jest.fn();

        const myAtom$ = atom(true);
        const myDerivation$ = myAtom$.derive(hasDerived);

        // It should not have done anything at this moment
        expect(hasDerived).not.toHaveBeenCalled();

        const stopper = myDerivation$.react(() => '');

        /**
         * ** Your Turn **
         *
         * Ok, it's your turn to complete the expectations.
         */
        expect(hasDerived).toHaveBeenCalledTimes(1); // because of the react.

        myDerivation$.get();

        expect(hasDerived).toHaveBeenCalledTimes(1); // no update because someone is reacting, and there has been no update in value.

        myAtom$.set(false);

        expect(hasDerived).toHaveBeenCalledTimes(2); // `myDerivation`s value has changed, so update.

        myDerivation$.get();

        expect(hasDerived).toHaveBeenCalledTimes(2); // no update.

        stopper();

        expect(hasDerived).toHaveBeenCalledTimes(2); // stopping doesn't change the value...

        myDerivation$.get();

        expect(hasDerived).toHaveBeenCalledTimes(3); // ...but now, it is not being reacted to, so it goes back to updating every time `.get()` is called!

        /**
         * Since the `.react()` already listens to the value(changes) there is
         * no need to recalculate whenever a `.get()` is called.
         *
         * But when the reactor has stopped, the derivation has to be calculated
         * again.
         */
        // Okay, clear, but why?
        // I see... because we don't want to keep internal states and such and track changes when no-one is listening! It is a waste of effort.
        // So we only keep track of changes when a react is listening.
    });

    /**
     * The basics of `Derivable` caching are seen above.
     * But there is one more trick up it's sleeve.
     */
    it('cached changes', () => {
        const first = jest.fn();
        const second = jest.fn();

        const myAtom$ = atom(1);
        const first$ = myAtom$.derive(i => {
            first(i); // Call the mock function, to let it know we were here
            return i > 2;
        });
        const second$ = first$.derive(second);

        // As always, they should not have fired yet
        expect(first).not.toHaveBeenCalled();
        expect(second).not.toHaveBeenCalled();

        second$.react(() => '');

        // And as expected, they now should both have fired once
        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();

        /**
         * ** Your Turn **
         *
         * But what to expect now?
         */

        // Note that this is the same value as it was initialized with
        myAtom$.set(1);

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);

        myAtom$.set(2);

        expect(first).toHaveBeenCalledTimes(2); // different INPUT [2], so call again
        expect(second).toHaveBeenCalledTimes(1); // same INPUT [false], so no change

        myAtom$.set(3);

        expect(first).toHaveBeenCalledTimes(3); // different INPUT [3]
        expect(second).toHaveBeenCalledTimes(2); // different INPUT [true]

        myAtom$.set(4);

        expect(first).toHaveBeenCalledTimes(4); // different INPUT [4]
        expect(second).toHaveBeenCalledTimes(2); // same INPUT [true]

        /**
         * Can you explain the behavior above?
         *
         * It is why we say that `@skunkteam/sherlock` deals with reactive state
         * and not events (as RxJS does for example).
         *
         * Events can be very useful, but when data is involved, you are
         * probably only interested in value changes. So these changes can and
         * need to be cached and deduplicated.
         */
    });

    /**
     * So if the new value of a `Derivable` is equal to the old, it won't
     * propagate a new event. But what does it mean to be equal in a
     * `Derivable`?
     *
     * Strict `===` equality would mean that `NaN` and `NaN` would not even be
     * equal. `Object.is()` equality would be better, but would mean that
     * structurally equal objects could be different.
     */
    it('equality', () => {
        const atom$ = atom<unknown>({});
        const hasReacted = jest.fn();

        atom$.react(hasReacted, { skipFirst: true });
        expect(hasReacted).toHaveBeenCalledTimes(0); // added for clarity, in case people missed the `skipFirst` or its implication

        atom$.set({});

        /**
         * ** Your Turn **
         *
         * The `Atom` is set with exactly the same object as before. Will the
         * `.react()` fire?
         */
        expect(hasReacted).toHaveBeenCalledTimes(1); // not considered equal (`{} !== {}`)

        /**
         * But what if you use an object, that can be easily compared through a
         * library like `ImmutableJS`?
         *
         * Let's try an `Immutable.Seq`
         */
        atom$.set(Seq.Indexed.of(1, 2, 3));
        // Let's reset the spy here, to start over
        hasReacted.mockClear();
        expect(hasReacted).not.toHaveBeenCalled();

        atom$.set(Seq.Indexed.of(1, 2, 3));
        /**
         * ** Your Turn **
         *
         * Do you think the `.react()` fired with this new value?
         */
        expect(hasReacted).toHaveBeenCalledTimes(0); // TODO: answer already given - is considered equal

        atom$.set(Seq.Indexed.of(1, 2));

        /**
         * ** Your Turn **
         *
         * And now?
         */
        expect(hasReacted).toHaveBeenCalledTimes(1); // TODO: answer already given - obviously unequal

        /**
         * In `@skunkteam/sherlock` equality is a bit complex:
         *
         * First we check `Object.is()` equality, if that is true, it is the
         * same, you can't deny that.
         *
         * After that it is pluggable. It can be anything you want.
         *
         * By default we try to use `.equals()`, to support libraries like
         * `ImmutableJS`.
         */
    });
});
