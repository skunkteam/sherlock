import { atom } from '@skunkteam/sherlock';

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
        myAtom$.react(reactor);
        // myAtom$.react(val => reactor(val)); // Alternatively, this would work too.
        // myAtom$.react((val, _) => reactor(val)); // Or this.

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
            const stopper = myAtom$.react(reactor);

            expectReact(1, 'initial value');

            /**
             * ** Your Turn **
             *
             * Call the `stopper`.
             */
            stopper();

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
            myAtom$.react((val, stopper) => {
                reactor(val);
                stopper();
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
                const stringEmpty = function () {
                    return !string$.get();
                };
                string$.react(reactor, { until: stringEmpty });
                // string$.react(reactor, { until: () => !string$.get() }); // Or, alternatively, in a single line:

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
                string$.react(reactor, { until: parent$ => !parent$.get() });

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
                boolean$.set(true);
                // It looks this will keep reacting until `boolean$`s value is set to false...
                let stopper = boolean$.react(reactor, { until: b$ => !b$ });

                boolean$.set(false);

                // ...but does it? Is the reactor still connected?
                expect(boolean$.connected).toBe(true);

                // The `b$` it obtains as argument is a `Derivable<boolean>`. This is a
                // reference value. Because we apply a negation to this, `b$` is coerced to a
                // boolean value, which will evaluate to `true` as `b$` is not `undefined`.
                // Thus, the whole expression will evaluate to `false`, independent of the value of
                // `boolean$`. Instead, you can get the value out of the `Derivable` using `.get()`:
                stopper(); // reset
                stopper = boolean$.react(reactor, { until: b$ => !b$.get() });
                expect(boolean$.connected).toBe(false);

                // You can also return the `Derivable<boolean>` after appling the negation
                // using the method designed for negating the boolean within a `Derivable<boolean>`:
                stopper();
                boolean$.react(reactor, { until: b$ => b$.not() });
                expect(boolean$.connected).toBe(false);
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
            sherlock$.react(reactor, { from: parent$ => parent$.is('dear') });

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
            count$.react(reactor, { when: parent$ => parent$.get() % 2 === 0 && parent$.get() !== 4 });
            // count$.react(reactor, { when: parent$ => parent$.derive(value => value % 2 === 0 && value !== 4) }); // Or, alternatively:

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
            const count$ = atom(0);

            /**
             * ** Your Turn **
             *
             * Say you want to react when `count$` is larger than 3. But not the first time...
             */
            count$.react(reactor, { when: parent$ => parent$.get() > 3, skipFirst: true });
            // count$.react(reactor, { when: parent$ => parent$.derive(value => value > 3), skipFirst: true }); // Or, alternatively:

            expectReact(0);

            for (let i = 0; i <= 5; i++) {
                count$.set(i);
            }
            expectReact(1, 5); // it should have skipped the 4 and only reacted to the 5

            for (let i = 0; i <= 5; i++) {
                count$.set(i);
            }
            expectReact(3, 5); // now it should have reacted to the 4 and 5 (and the 5 of last time)
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
            const count$ = atom(0);

            /**
             * ** Your Turn **
             *
             * Say you want to react when `count$` is higher than 3. But only the first time...
             *
             * *Hint: you will need to combine `once` with another option*
             */
            count$.react(reactor, { once: true, when: parent$ => parent$.get() > 3 });
            // count$.react(reactor, { once: true, when: parent$ => parent$.derive(value => value > 3) }); // Or, alternatively:

            expectReact(0);

            for (let i = 0; i <= 5; i++) {
                count$.set(i);
            }
            expectReact(1, 4); // it should have only registered the 4 and not the 5

            for (let i = 0; i <= 5; i++) {
                count$.set(i);
            }
            expectReact(1, 4); // and after that, it should really be finished. :-)
        });
    });

    describe('order of execution', () => {
        /**
         * As you can see for yourself in  libs/sherlock/src/lib/derivable/mixins/take.ts,
         * the options `from`, `until`, `when`, `skipFirst` and `once` are tested in this specific order:
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
            const myAtom$ = atom(0);
            myAtom$.react(reactor, { from: parent$ => parent$.is(3), until: parent$ => parent$.is(2) });

            for (let i = 1; i <= 5; i++) {
                myAtom$.set(i);
            }

            // The reactor starts reacting when `myAtom` gets the value 3, but stops when it gets the value 2.
            // But because `myAtom$` obtains the value 2 before it obtains 3...
            // ...how many times was the reactor called, if any?
            expectReact(3, 5); // `from` evaluates before `until`, so it reacted to 3, 4 and 5.
        });

        it('`when` and `skipFirst`', () => {
            const myAtom$ = atom(0);
            myAtom$.react(reactor, { when: v => v.is(1), skipFirst: true });

            myAtom$.set(1);

            // The reactor reacts when `myAtom$` is 1 but skips the first number.
            // `myAtom$` starts out at 0. Does the reactor skip only the 0 or also the 1?
            expectReact(0); // `skipFirst` triggers only when `when` evaluates to true, so it also skips the 1.
        });

        it('`from`, `until`, `when`, `skipFirst`, and `once`', () => {
            const myAtom$ = atom(0);
            myAtom$.react(reactor, {
                from: parent$ => parent$.is(5),
                until: parent$ => parent$.is(1),
                when: parent$ => [2, 3, 4].includes(parent$.get()),
                skipFirst: true,
                once: true,
            });

            for (let v of [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3]) {
                myAtom$.set(v);
            }

            // `from` and `until` allow the reactor to respectively start when `myAtom$` has value 5, and stop when it has value 1.
            // Meanwhile, `when` allows neither of those values and only allows the values 2, 3, and 4.
            // `skipFirst` and `once` are also added, just to bring the whole group together.
            // so, how many times is the reactor called, and what was the last argument (if any)?
            expectReact(1, 3);
            // `from` makes it start at the first `5`. `when` allows the next `4`,`3`, and `2`, but
            // `skipFirst` ensures that the first `4` is skipped. `once` then ensures that only the `3` is
            // reacted to. Before the `until` can trigger from a `1`, the `once` has already stopped the reactor.
        });
    });

    describe('challenge', () => {
        it('onDisconnect', () => {
            const connected$ = atom('disconnected');
            /**
             * ** Your Turn **
             *
             * `connected$` indicates the current connection status. It is one of:
             * > 'connected';
             * > 'disconnected';
             * > 'standby'.
             *
             * We want our reactor to trigger once, when the device is not connected,
             * (`standby` or `disconnected`), e.g. for cleanup. However, we do not want
             * it to trigger right away, even though we start at `disconnected`.
             *
             * This should be possible with three simple ReactorOptions.
             */
            connected$.react(reactor, { when: parent$ => parent$.is('connected').not(), skipFirst: true, once: true });

            // It starts as 'disconnected'
            expectReact(0);

            // At this point, the device connects, no reaction should occur yet.
            connected$.set('connected');
            expectReact(0);

            // When the device goes to standby, the reaction should fire once
            connected$.set('standby');
            expectReact(1, 'standby');

            // After that, nothing should change anymore.
            connected$.set('disconnected');
            expectReact(1, 'standby');
            connected$.set('standby');
            expectReact(1, 'standby');
            connected$.set('connected');
            expectReact(1, 'standby');

            // It should not react again after this.
            expect(connected$.connected).toBeFalse();
            // * Note: this `.connected` refers to whether this `Derivable`
            // is being (indirectly) observed by a reactor.
        });
    });
});
