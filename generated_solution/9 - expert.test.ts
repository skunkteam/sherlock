import { DerivableAtom, atom, derive } from '@skunkteam/sherlock';
import { derivableCache } from '@skunkteam/sherlock-utils';

/**
 * ** Your Turn **
 *
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;

describe('expert', () => {
    describe('`.autoCache()`', () => {
        /**
         * If a `.get()` is called on a `Derivable` all derivations will be
         * executed. But what if a `Derivable` is used multiple times in another
         * `Derivable`?
         */
        it('multiple executions', () => {
            const hasDerived = jest.fn();

            const myAtom$ = atom(true);
            const myFirstDerivation$ = myAtom$.derive(hasDerived);
            const mySecondDerivation$ = myFirstDerivation$.derive(
                () => myFirstDerivation$.get() + myFirstDerivation$.get(),
            );

            /**
             * ** Your Turn **
             *
             * `hasDerived` is used in the first derivation. But has it been
             * called at this point?
             */

            // `.toHaveBeenCalled()` or `.not.toHaveBeenCalled()`? ↴
            expect(hasDerived).not.toHaveBeenCalled(); 

            mySecondDerivation$.get();

            /**
             * ** Your Turn **
             *
             * Now that we have gotten `mySecondDerivation$`, which calls
             * `.get()` on the first multiple times. How many times has the
             * first `Derivable` actually executed its derivation?
             */
            // how many times?
            expect(hasDerived).toHaveBeenCalledTimes(3); 
        });

        /**
         * So when a `Derivable` is reacting the value is cached and can be
         * gotten from cache. But if this `Derivable` is used multiple times in
         * a row, even in another derivation it isn't cached.
         *
         * To fix this issue, `.autoCache()` exists. It will cache the
         * `Derivable`s value until the next Event Loop `tick`.
         *
         * So let's try the example above with this feature
         */
        it('autoCaching', async () => {
            const firstHasDerived = jest.fn();
            const secondHasDerived = jest.fn();

            /**
             * ** Your Turn **
             *
             * Use `.autoCache()` on one of the `Derivable`s below. To make the
             * expectations pass.
             */
            const myAtom$ = atom(true);
            const myFirstDerivation$ = myAtom$.derive(firstHasDerived).autoCache(); 
            const mySecondDerivation$ = myFirstDerivation$.derive(() =>
                secondHasDerived(myFirstDerivation$.get() + myFirstDerivation$.get()),
            );

            // first before .get()
            expect(firstHasDerived).not.toHaveBeenCalled();

            // second before .get()
            expect(secondHasDerived).not.toHaveBeenCalled();

            mySecondDerivation$.get();

            // first after first .get()
            expect(firstHasDerived).toHaveBeenCalledOnce();
            // second after first .get()
            expect(secondHasDerived).toHaveBeenCalledOnce();

            mySecondDerivation$.get();

            // first after second .get()
            expect(firstHasDerived).toHaveBeenCalledOnce();
            // second after second .get()
            expect(secondHasDerived).toHaveBeenCalledTimes(2);

            /**
             * Notice that the first `Derivable` has only been executed once,
             * even though the second `Derivable` executed twice.
             *
             * Now we wait a tick for the cache to be invalidated.
             */

            await new Promise(r => setTimeout(r, 1));

            /**
             * ** Your Turn **
             *
             * Now what do you expect?
             */
            mySecondDerivation$.get();

            // first after last .get()
            expect(firstHasDerived).toHaveBeenCalledTimes(2); 
            // second after last .get()
            expect(secondHasDerived).toHaveBeenCalledTimes(3); 
        });
    });

    /**
     * Some `Derivable`s need an input to be calculated. If this `Derivable` is
     * async or has a big setup process, you may still want to create it only
     * once, even if the `Derivable` is requested more than once for the same
     * resource.
     *
     * Let's imagine a `stockPrice$(stock: string)` function, which returns a
     * `Derivable` with the current price for the given stock. This `Derivable`
     * is async, since it will try to retrieve the current price on a distant
     * server.
     *
     * Let's see what can go wrong first, and we will try to fix it after that.
     *
     * *Note that a `Derivable` without an input is (hopefully) created only
     * once, so it does not have this problem*
     */
    describe('`derivableCache`', () => {
        type Stocks = 'GOOGL' | 'MSFT' | 'APPL';

        let stockPrice$: jest.Mock<DerivableAtom<number>, [Stocks], any>;
        const reactSpy = jest.fn();

        beforeEach(() => {
            // By default the stock price retriever returns unresolved.
            stockPrice$ = jest.fn(_ => atom.unresolved());
            reactSpy.mockClear();
        });

        function reactor(v: any) {
            reactSpy(v);
        }

        /**
         * If the function to create the `Derivable` is called multiple times,
         * the `Derivable` will be created multiple times. Any setup this
         * `Derivable` does, will be executed every time.
         */
        it('multiple setups', () => {
            // To not make things difficult with `unresolved` for this example,
            // imagine we get a response synchronously
            stockPrice$ = jest.fn(_ => atom(1079.11));

            const html$ = derive(
                () => `
                <h1>Alphabet Price ($${stockPrice$('GOOGL').get().toFixed(2)})</h1>
                <p>Some important text that uses the current price ($${stockPrice$('GOOGL')
                    .get()
                    .toFixed()}) as well</p>
            `,
            );
            html$.react(reactor);

            expect(html$.connected).toEqual(true);
            expect(reactSpy).toHaveBeenCalledOnce();

            /**
             * ** Your Turn **
             *
             * The `Derivable` is connected and has emitted once, but in that
             * value the 'GOOGL' stockprice was displayed twice. We know that
             * using a `Derivable` twice in a connected `Derivable` will make
             * the second `.get()` use a cached value.
             *
             * But does that apply here?
             * How many times has the setup run, for the price `Derivable`.
             */
            expect(stockPrice$).toHaveBeenCalledTimes(2); 

            /** Can you explain this behavior? */
            // ANSWER-BLOCK-START
            // Yes: it creates a different Derivable every time, so it cannot use any caching.
            // This is a similar issue to the `pairwise()` issue from tutorial 7, where, when we
            // used lambda functions, we made a new pairwise object every time.
            // ANSWER-BLOCK-END
        });

        /**
         * An other problem can arise when the setup is done inside a derivation
         */
        describe('setup inside a derivation', () => {
            /**
             * When the setup of a `Derivable` is done inside the same
             * derivation as where `.get()` is called. You may be creating some
             * problems.
             */
            it('unresolveable values', () => {
                // First setup an `Atom` with the company we are currently
                // interested in
                const company$ = atom<Stocks>('GOOGL');

                // Based on that `Atom` we derive the stockPrice
                const price$ = company$.derive(company => stockPrice$(company).get());

                price$.react(reactor);

                // Because the stockPrice is still `unresolved` the reactor
                // should not have emitted anything yet
                expect(reactSpy).not.toHaveBeenCalled();

                // Now let's increase the price
                // First we have to get the atom that was given by the
                // `stockPrice$` stub
                const googlPrice$ = stockPrice$.mock.results[0].value as DerivableAtom<number>;

                // Check if it is the right `Derivable`
                expect(googlPrice$.connected).toEqual(true);
                expect(googlPrice$.value).toEqual(undefined);

                // Then we set the price
                googlPrice$.set(1079.11);

                /**
                 * ** Your Turn **
                 *
                 * So the value was increased. What do you think happened?
                 */

                // How often was the reactor on price$ called?
                expect(reactSpy).toHaveBeenCalledTimes(0); 

                // And how many times did the setup run?
                expect(stockPrice$).toHaveBeenCalledTimes(2); 

                // What's the value of price$ now?
                expect(price$.value).toEqual(undefined); 

                // And the value of googlPrice$?
                expect(googlPrice$.value).toEqual(1079.11); 

                // Is googlPrice$ still even driving any reactors?
                expect(googlPrice$.connected).toEqual(false); 

                /**
                 * Can you explain this behavior?
                 *
                 * Thought about it? Here is what happened:
                 * -  Initially `stockPrice$('GOOGL')` emits a `Derivable`
                 *    (`googlPrice$`), which is unresolved.
                 * -  Inside the `.derive()` we subscribe to updates on that
                 *    `Derivable`.
                 * -  When `googlPrice$` emits a new value, the `.derive()` step
                 *    is run again.
                 * -  Inside this step, the setup is run again and a new
                 *    `Derivable` (`newGooglPrice$`) is created and subscribed
                 *    to.
                 * -  Unsubscribing from the old `googlPrice$`.
                 *
                 * This `newGooglPrice$` is newly created and `unresolved`
                 * again. So the end result is an `unresolved` `price$`
                 * `Derivable`.
                 */

                /**
                 * ** BONUS **
                 *
                 * The problem above can be fixed without a `derivableCache`.
                 * If we split the `.derive()` step into two steps, where the
                 * first does the setup, and the second unwraps the `Derivable`
                 * created in the first. This way, a newly emitted value from
                 * the created `Derivable` will not run the setup again and
                 * everything should work as expected.
                 *
                 * ** Your Turn ** TODO: not in the SOLUTIONS!!
                 *
                 * *Hint: there is even an `unwrap` helper function for just
                 * such an occasion, try it!*
                 */
            });

            /**
             * But even when you split the setup and the `unwrap`, you may not
             * be out of the woods yet! This is actually a problem that most
             * libraries have a problem with, if not properly accounted for.
             */
            it('uncached Derivables', () => {
                // First we setup an `Atom` with the company we are currently
                // interested in. This time we support multiple companies though
                const companies$ = atom<Stocks[]>(['GOOGL']);

                // Based on that `Atom` we derive the stockPrices
                const prices$ = companies$
                    /**
                     * There is no need derive anything here, so we use `.map()`
                     * on `companies$`. And since `companies` is an array of
                     * strings, we `.map()` over that array to create an array
                     * of `Derivable`s.
                     */
                    .map(companies => companies.map(company => stockPrice$(company)))
                    // Then we get the prices from the created `Derivable`s in a separate step
                    .derive(price$s => price$s.map(price$ => price$.value));

                prices$.react(reactor);

                // Because we use `.value` instead of `.get()` the reactor
                // should emit immediately this time.

                // But it should emit `undefined`.
                expect(reactSpy).toHaveBeenCalledExactlyOnceWith([undefined]);

                // Now let's increase the price. First we have to get the atom
                // that was given by the `stockPrice$` stub:
                const googlPrice$ = stockPrice$.mock.results[0].value as DerivableAtom<number>;
                // Check if it is the right `Derivable`
                expect(googlPrice$.connected).toBe(true);

                // Then we set the price, as before
                googlPrice$.set(1079.11);

                /**
                 * ** Your Turn **
                 *
                 * So the value was increased. What do you think happened now?
                 */
                expect(reactSpy).toHaveBeenCalledTimes(2); 
                expect(reactSpy).toHaveBeenLastCalledWith([1079.11]); 

                /**
                 * So that worked, now let's try and add another company to the
                 * list.
                 */
                companies$.swap(current => [...current, 'APPL']);

                expect(companies$.get()).toEqual(['GOOGL', 'APPL']);

                /**
                 * ** Your Turn **
                 *
                 * With both 'GOOGL' and 'APPL' in the list, what do we expect
                 * as an output?
                 *
                 * We had a price for 'GOOGL', but not for 'APPL'...
                 */
                expect(reactSpy).toHaveBeenCalledTimes(3); 
                expect(reactSpy).toHaveBeenCalledWith([undefined, undefined]); 
            });
        });

        /**
         * So we know a couple of problems that can arise, but how do we fix
         * them.
         */
        describe('a solution', () => {
            /**
             * Let's try putting `stockPrice$` inside a `derivableCache`.
             * `derivableCache` requires a `derivableFactory`, this specifies
             * the setup for a given key.
             *
             * We know the key, and what to do with it, so let's try it!
             */
            const priceCache$ = derivableCache((company: Stocks) => stockPrice$(company));
            /**
             * *Note that from this point forward we use `priceCache$` where we
             * used to use `stockPrice$` directly*
             */

            it('should fix everything :-)', () => {
                // First setup an `Atom` with the company we are currently
                // interested in
                const companies$ = atom<Stocks[]>(['GOOGL']);

                const html$ = companies$.derive(companies =>
                    companies.map(
                        company => `
                            <h1>Alphabet Price ($ ${priceCache$(company).value || 'unknown'})</h1>
                            <p>Some important text that uses the current price ($ ${
                                priceCache$(company).value || 'unknown'
                            }) as well</p>`,
                    ),
                );

                html$.react(reactor);

                expect(html$.connected).toEqual(true);
                expect(reactSpy).toHaveBeenCalledOnce();
                // Convenience function to return the first argument of the last
                // call to the reactor
                function lastEmittedHTMLs() {
                    return reactSpy.mock.lastCall[0];
                }

                // The last call, should have the array of HTML's as first
                // argument
                expect(lastEmittedHTMLs()[0]).toContain('$ unknown');

                /**
                 * ** Your Turn **
                 *
                 * The `Derivable` is connected and has emitted once.
                 * The price for the given company 'GOOGL' is displayed twice,
                 * just as in the first test.
                 *
                 * Has anything changed, by using the `derivableCache`?
                 */
                expect(stockPrice$).toHaveBeenCalledTimes(1); 

                // Now let's resolve the price
                stockPrice$.mock.results[0].value.set(1079.11);

                /**
                 * ** Your Turn **
                 *
                 * Last time this caused the setup to run again, resolving to
                 * `unresolved` yet again.
                 *
                 * What happens this time? Has the setup run again?
                 */
                expect(stockPrice$).toHaveBeenCalledTimes(1); 
                // Ok, but did it update the HTML?
                expect(reactSpy).toHaveBeenCalledTimes(2); 
                expect(lastEmittedHTMLs()[0]).toContain('$ 1079.11'); 

                // Last chance, what if we add a company
                companies$.swap(current => [...current, 'APPL']);

                /**
                 * ** Your Turn **
                 *
                 * Now the `stockPrice$` function should have at least run again
                 * for 'APPL'.
                 *
                 * But did it calculate 'GOOGL' again too?
                 */
                expect(stockPrice$).toHaveBeenCalledTimes(2); 
                expect(reactSpy).toHaveBeenCalledTimes(3); 
                // The first should be the generated HTML for 'GOOGL'.
                expect(lastEmittedHTMLs()[0]).toContain('$ 1079.11'); 
                // The second should be the generated HTML for 'APPL'.
                expect(lastEmittedHTMLs()[1]).toContain('$ unknown'); 
            });
        });
    });
});
