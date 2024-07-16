import { atom } from '@skunkteam/sherlock';

/**
 * ** Your Turn **
 *
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;

/**
 * In the intro we have seen a basic usage of the `.react()` method.
 * Let's dive a bit deeper into the details of this method.
 */
describe('reacting', () => {
    // For easy testing we can count the number of times a reactor was called,
    let wasCalledTimes: number;
    // and record the last value it reacted to.
    let lastValue: any;

    // reset the values before each test case
    beforeEach(() => {
        wasCalledTimes = 0;
        lastValue = undefined;
    });

    // The reactor to be given to the `.react()` method.
    function reactor(val: any) {
        wasCalledTimes++;
        lastValue = val;
    }

    // Of course we are lazy and don't want to type these assertions over
    // and over. :-)
    function expectReact(reactions: number, value?: any) {
        // Reaction was called # times
        expect(wasCalledTimes).toEqual(reactions);
        // Note the actual point of failure is:
        // at Object.<anonymous> (3 - reacting.test.ts:LINE_NUMBER:_)
        //            V                                ~~~~~~~~~~~~

        // Last value of the reaction was #
        expect(lastValue).toEqual(value);
    }

    /**
     * Every `Derivable` always has a current state. So the `.react()` method
     * does not need to wait for a value, there already is one.
     *
     * This means that `.react()` will fire directly when called. When the
     * `Derivable` has a new state, this will also fire `.react()`
     * synchronously.
     *
     * So the very next line after `.set()` is called, the `.react()` has
     * already fired!
     *
     * (Except when the `Derivable` is `unresolved`, but more on that later.)
     */
    it('reacting synchronously', () => {
        const myAtom$ = atom('initial value');
        // A trivial `expect` to silence TypeScript's noUnusedLocals.
        expect(myAtom$.get()).toEqual('initial value');

        // There should not have been a reaction yet
        expectReact(0);

        /**
         * ** Your Turn **
         *
         * Time to react to `myAtom$` with the `reactor()` function defined
         * above.
         */
        myAtom$.react((val, _) => reactor(val));
        // myAtom$.react(reactor); // OR this. TS will ignore any additional arguments you might give it.

        expectReact(1, 'initial value');

        // Now set a 'new value' to `myAtom$`.
        myAtom$.set('new value');

        expectReact(2, 'new value');
    });

    /**
     * A reactor will go on forever. This is often not what you want, and almost
     * always a memory leak.
     *
     * So it is important to stop a reactor at some point. The `.react()` method
     * has different ways of dealing with this.
     */
    describe('stopping a reaction', () => {
        /**
         * The easiest is the 'stopper' function, every `.react()` call will
         * return a `function` that will stop the reaction.
         */
        it('with the stopper function', () => {
            const myAtom$ = atom('initial value');
            // A trivial `expect` to silence TypeScript's noUnusedLocals
            expect(myAtom$.get()).toEqual('initial value');

            /**
             * ** Your Turn **
             *
             * catch the returned `stopper` in a variable
             */

            // let stopFunc: () => void = () => {}; // dummy initial value
            // myAtom$.react((val, stop) => {
            //     reactor(val);
            //     stopFunc = stop;
            // });
            const stopFunc = myAtom$.react((val, _) => reactor(val));
            expectReact(1, 'initial value');

            /**
             * ** Your Turn **
             *
             * Call the `stopper`.
             */
            stopFunc();

            myAtom$.set('new value');

            // And the reaction stopped.
            expectReact(1, 'initial value');
        });

        /**
         * Everytime the reaction is called, it also gets the stopper `function`
         * as a second parameter.
         */
        it('with the stopper callback', () => {
            const myAtom$ = atom('initial value');
            // A trivial `expect` to silence TypeScript's noUnusedLocals
            expect(myAtom$.get()).toEqual('initial value');

            /**
             * ** Your Turn **
             *
             * In the reaction below, use the stopper callback to stop the
             * reaction
             */
            myAtom$.react((val, stop) => {
                reactor(val);
                stop();
            });

            expectReact(1, 'initial value');

            myAtom$.set('new value');

            // And the reaction stopped.
            expectReact(1, 'initial value');
        });
    });

    /**
     * The reactor `options` are a way to modify when and how the reactor will
     * react to changes in the `Derivable`.
     */
    describe('reactor options', () => {
        /**
         * Another way to make a reactor stop at a certain point, is by
         * specifying an `until` in the `options`.
         * `until` can be given either a `Derivable` or a `function`.
         *
         * If a `function` is given, this `function` will be given the
         * `Derivable` that is the source of the reaction as a parameter.
         * This `function` will track all `.get()`s, so can use any `Derivable`.
         * It can return a `boolean` or a `Derivable<boolean>`.
         *
         * *Note: the reactor options `when` and `from` can also be set to a
         * `Derivable`/`function` as described here.*
         *
         * The reactor will stop directly when `until` becomes true.
         * If that happens at exactly the same time as the `Derivable` getting a
         * new value, it will not react again.
         */
        describe('reacting `until`', () => {
            const boolean$ = atom(false);
            const string$ = atom('Value');
            beforeEach(() => {
                // reset
                boolean$.set(false);
                string$.set('Value');
            });

            /**
             * If a `Derivable` is given, the reaction will stop once that
             * `Derivable` becomes `true`/truthy.
             */
            it('an external `Derivable`', () => {
                /**
                 * ** Your Turn **
                 *
                 * Try giving `boolean$` as `until` option.
                 */
                string$.react(reactor, { until: boolean$ });

                // It should react directly as usual.
                expectReact(1, 'Value');

                // It should keep reacting as usual.
                string$.set('New value');
                expectReact(2, 'New value');

                // We set `boolean$` to true, to stop the reaction
                boolean$.set(true);

                // The reactor has immediately stopped, so it still reacted
                // only twice:
                expectReact(2, 'New value');

                // Even when `boolean$` is set to `false` again...
                boolean$.set(false);

                // ... and a new value is introduced:
                string$.set('Another value');

                // The reactor won't start up again, so it still reacted
                // only twice:
                expectReact(2, 'New value');
            });

            /**
             * A function can also be given as `until`. This function will be
             * executed in every derivation. Just like using a `Derivable` as
             * an `until`, the Reactor will keep reacting until the result of
             * this function evaluates thruthy.
             *
             * This way any `Derivable` can be used in the calculation.
             */
            it('a function', () => {
                /**
                 * ** Your Turn **
                 *
                 * Since the reactor options expect a boolean, you will
                 * sometimes need to calculate the option.
                 *
                 * Try giving an externally defined `function` that takes no
                 * parameters as `until` option.
                 *
                 * Use `!string$.get()` to return `true` when the `string` is
                 * empty.
                 */
                string$.react(reactor, { until: () => !string$.get() });

                // It should react as usual:
                string$.set('New value');
                string$.set('Newer Value');
                expectReact(3, 'Newer Value');

                // Until we set `string$` to an empty string to stop the
                // reaction:
                string$.set('');
                // The reactor was immediately stopped, so even the empty string
                // was never given to the reactor:
                expectReact(3, 'Newer Value');
            });

            /**
             * Since the example above where the `until` is based on the parent
             * `Derivable` occurs very frequently, this `Derivable` is given as
             * a parameter to the `until` function.
             */
            it('the parent `Derivable`', () => {
                /**
                 * ** Your Turn **
                 *
                 * Try using the first parameter of the `until` function to do
                 * the same as above.
                 */
                string$.react(reactor, { until: s => !s.get() });

                // It should react as usual.
                string$.set('New value');
                string$.set('Newer Value');
                expectReact(3, 'Newer Value');

                // Until we set `string$` to an empty string, to stop
                // the reaction:
                string$.set('');

                // The reactor was immediately stopped, so even the empty string
                // was never given to the reactor:
                expectReact(3, 'Newer Value');
            });

            /**
             * Sometimes, the syntax may leave you confused.
             */
            it('syntax issues', () => {
                // It looks this will start reacting until `boolean$`s value is false...
                let stopper = boolean$.react(reactor, { until: b => !b });

                // ...but does it? (Remember: `boolean$` starts out as `false`)
                expect(boolean$.connected).toBe(__YOUR_TURN__);

                // The `b` it obtains as argument is a `Derivable<boolean>`. This is a
                // reference value which will evaluate to `true` as it is not `undefined`.
                // Thus, the negation will evaluate to `false`, independent of the value of
                // the boolean. You can get the boolean value our of the `Derivable` using `.get()`:
                stopper();
                stopper = boolean$.react(reactor, { until: b => !b.get() });
                expect(boolean$.connected).toBe(__YOUR_TURN__);

                // You can also return the `Derivable<boolean>` and apply the negation
                // with the method designed for it:
                stopper();
                boolean$.react(reactor, { until: b => b.not() });
                expect(boolean$.connected).toBe(__YOUR_TURN__);
            });
        });

        /**
         * Sometimes you may not need to react to the first couple of values of
         * the `Derivable`. This can be because of the value of the `Derivable`
         * or due to external conditions.
         *
         * The `from` option is meant to help with this. The reactor will only
         * start after it becomes true. Once it has become true, the reactor
         * will not listen to this option any more and react as usual.
         *
         * The interface of `from` is the same as `until` (i.e. it also gets
         * the parent derivable as first parameter when it's called.)
         *
         * * Note: when using `from`, `.react()` will (most often) not react
         * synchronously any more. As that is the function of this option.* // TODO: word differently... is not a `note`, but the intended effect.
         */
        it('reacting `from`', () => {
            const sherlock$ = atom('');

            /**
             * ** Your Turn **
             *
             * We can react here, but restrict the reactions to start when the
             * keyword 'dear' is set. This will skip the first three reactions,
             * but react as usual after that.
             *
             * *Hint: remember the `.is()` method from tutorial 2?*
             */
            sherlock$.react(reactor, { from: sherlock$.is('dear') });

            expectReact(0);
            ['Elementary,', 'my', 'dear', 'Watson'].forEach(txt => sherlock$.set(txt));

            expectReact(2, 'Watson');
        });

        /**
         * Sometimes you may want to react only on certain values or when
         * certain conditions are met.
         *
         * This can be achieved by using the `when` reactor option.
         * Where `until` and `from` can only be triggered once to stop or start
         * reacting, `when` can be flipped as often as you like and the reactor
         * will respect the current state of the `when` function/Derivable.
         */
        it('reacting `when`', () => {
            const count$ = atom(0);

            /**
             * ** Your Turn **
             *
             * Now, let's react to all even numbers.
             * Except 4, we don't want to make it too easy now.
             */
            count$.react(reactor, { when: v => v.get() % 2 === 0 && v.is(4).not() });
            count$.react(reactor, { when: v => v.get() % 2 === 0 && v.get() !== 4 });
            // TODO: why can I apply `&&` to `number` and Derivable<number>??
            // >>>  e.g. `when` kan zowel booleans and Derivable<boolean> vanwege Unwrappable type xD

            expectReact(1, 0);

            for (let i = 0; i <= 4; i++) {
                count$.set(i);
            }
            expectReact(2, 2);
            for (let i = 4; i <= 10; i++) {
                count$.set(i);
            }
            expectReact(5, 10);
        });

        /**
         * Normally the reactor will immediately fire with the current value.
         * If you want the reactor to fire normally, just not the first time,
         * there is also a `boolean` option: `skipFirst`.
         */
        it('reacting with `skipFirst`', () => {
            const done$ = atom(false);

            /**
             * ** Your Turn **
             *
             * Say you want to react when `done$` is true. But not right away.. // TODO: change to use number?
             */
            done$.react(reactor, { when: d => d.is(true) }); // TODO: true expected answer given description: the test case needs asjustment!
            // SKIPFIRST negeert de eerste keer dat WHEN true is! Niet de eerste keer in general.
            // `// Doesn't react, because the new value equals the previous value that was seen by the reactor.`
            // libs/sherlock/src/lib/reactor/reactor.test.ts:136
            // Hij accepteert alleen waardes die anders zijn dan zijn huidige. Omdat hij alleen `true` accepteert, kan hij nooit meer updaten!
            // => false accepteert de `when` niet;
            // => true is zelfde als voorheen.
            // Ik denk dat hij, ondanks dat `skipFirst` de eerste true genegeerd heeft, hij hem wel onthouden heeft als last seen value. Expected!
            // Zie libs/sherlock/src/lib/derivable/mixins/take.ts voor volgorde van events?
            // Als je `events` wilt, kan je beter Observables ofzo gebruiken. Je wilt dit patroon van "elke keer dat je true ziet, pas aan" eigenlijk niet hier.
            // kan beter numbers gebruiken om dit te testen! `<= 4` ofzo
            // En extra testje hiervoor!
            expectReact(0);

            done$.set(true);
            expectReact(0);

            done$.set(false);
            expectReact(0);

            done$.set(true);
            expectReact(1, true);
        });

        /**
         * With `once` you can stop the reactor after it has emitted exactly
         * one value. This is a `boolean` option.
         *
         * Without any other `options`, this is just a strange way of typing
         * `.get()`. But when combined with `when`, `from` or `skipFirst`, it
         * can be very useful.
         */
        it('reacting `once`', () => {
            const finished$ = atom(false);

            /**
             * ** Your Turn **
             *
             * Say you want to react when `finished$` is true. It can not finish
             * twice.
             *
             * *Hint: you will need to combine `once` with another option*
             */
            finished$.react(reactor, { once: true, when: f => f.get() }); // TODO: make sure the test captures the diff between `f` and `f.get()` here!
            // see next `challenge` for a case where there is a difference.
            expectReact(0);

            // When finished it should react once.
            finished$.set(true);
            expectReact(1, true);

            // After that it should really be finished. :-)
            finished$.set(false);
            finished$.set(true);
            expectReact(1, true);
        });
    });

    describe('order of execution', () => {
        // the interactions between `from`, `until`, `when`, `skipFirst`, `once`... - that order!
        // als het goed is nog niet behandeld (libs/sherlock/src/lib/derivable/mixins/take.ts)

        /**
         * The options `from`, `until`, `when`, `skipFirst` and `once` are tested in this specific order:
         * 1) firstly, `from` is checked. If `from` is/was true (or is not set in the options), we continue:
         * 2) secondly, `until` is checked. If `until` is false (or is not set in the options), we continue:
         * 3) thirdly, `when` is checked. If `when` is true (or is not set in the options), we continue:
         * 4) fourthly, `skipFirst` is checked. If `skipFirst` is false (or is not set in the options), we continue:
         * 5) lastly, `once` is checked.
         *
         * This means, for example, that `skipFirst` is only checked when `from` is true or unset, `until` is false or unset,
         * and `when` is true or unset. If e.g. `when` evaluates to false, `skipFirst` cannot trigger.
         */
        it('`from` and `until`', () => {
            const myAtom$ = atom<number>(0);
            myAtom$.react(reactor, { from: v => v.is(3), until: v => v.is(2) });

            for (let i = 1; i <= 5; i++) {
                myAtom$.set(i);
            }

            // the reactor starts reacting when `myAtom` gets the value 3, but stops when it gets the value 2.
            // But because `myAtom` obtains the value 2 before it obtains 3...
            // ...how many times was the reactor called, if any?
            expectReact(__YOUR_TURN__);
        });

        it('`when` and `skipFirst`', () => {
            const myAtom$ = atom<number>(0);
            myAtom$.react(reactor, { when: v => v.is(1), skipFirst: true });

            myAtom$.set(1);

            // the reactor reacts when `myAtom` is 1 but skips the first number.
            // `myAtom` starts at 0. Does the reactor skip the 0 or the 1?
            expectReact(__YOUR_TURN__);
        });

        it('`from`, `until`, `when`, `skipFirst`, and `once`', () => {
            const myAtom$ = atom<number>(0);
            myAtom$.react(reactor, {
                from: v => v.is(5),
                until: v => v.is(1),
                when: v => [2, 3, 4].includes(v.get()),
                skipFirst: true,
                once: true,
            });

            for (let v of [1, 2, 3, 5, 4, 3, 2, 1, 2, 3]) {
                myAtom$.set(v);
            }

            // `from` and `until` allow the reactor to respectively start when `myAtom` has value 5, and stop when it has value 1.
            // Meanwhile, `when` allows neither of those values and only allows the values 2, 3, and 4.
            // `skipFirst` and `once` are also added, just to bring the whole group together.
            // so, how many times is the reactor called, and what was the last argument (if any)?
            expectReact(__YOUR_TURN__);
        });
    });

    describe('challenge', () => {
        it('onDisconnect', () => {
            const connected$ = atom(false); // TODO: change to use number

            /**
             * ** Your Turn **
             *
             * We want our reactor to trigger once, when the user disconnects
             * (eg for cleanup).
             *
             * `connected$` indicates the current connection status.
             * This should be possible with three simple ReactorOptions
             * Hint: do not use `when`!
             */
            connected$.react(reactor, { from: c => c, skipFirst: true, once: true }); // WORKS, and intended
            connected$.react(reactor, { from: _ => connected$, skipFirst: true, once: true }); // WORKS, and intended
            connected$.react(reactor, { from: connected$, skipFirst: true, once: true }); // WORKS, and intended

            // TODO:
            // `when: c => !c.get()` gets the boolean out of the Derivable, applies `not`, and returns
            // `when: c => !c` coerces the Derivable to a boolean (whether it exists: true), applies `not` to this boolean, and returns false.
            // `when: c => c.not()` takes the boolean out of the Derivable, applies `not`, puts it back in a Derivable, and `when` is overloaded
            // ...to also be able to take the boolean out of the Derivable! So that is how you can also pass a Derivable - `when` takes the boolean out!
            // connected$.react(reactor, { when: c => !c.get(), from: c => c.get() }); // 1. DOES NOT WORK - the connection is not false afterwards
            // connected$.react(reactor, { when: c => !c, from: c => c }); // 2. DOES NOT WORK - see above
            // connected$.react(reactor, { when: c => !c.get(), skipFirst: true }); // 3. DOES NOT WORK...
            // ...as the first time c is false, this is accepted in the system even though skipfirst is true. Then...
            // ...the second time that c is false, it is seen as the same value and thus not accepted (only changes are accepted)! Hence:
            // setting a Derivable with a value it already has does not trigger it. It does not even go to `when`.

            // It starts as 'not connected'
            expectReact(0);

            // At this point, the user connects, no reaction should occur yet.
            connected$.set(true);
            expectReact(0);

            // When the user disconnects, the reaction should fire once
            connected$.set(false);
            expectReact(1, false);

            // After that, nothing should change anymore.
            connected$.set(true);
            expectReact(1, false);
            connected$.set(false);
            expectReact(1, false);

            // It should not react again after this.
            expect(connected$.connected).toBeFalse();
            // * Note: this `.connected` refers to whether this `Derivable`
            // is being (indirectly) observed by a reactor.
        });
    });
});
