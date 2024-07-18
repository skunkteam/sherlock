import { atom, DerivableAtom, error, FinalWrapper, unresolved } from '@skunkteam/sherlock';

/**
 * ** Your Turn **
 *
 * If you see this variable, you should do something about it. :-)
 */
export const __YOUR_TURN__ = {} as any;

// Silence TypeScript's import not used errors.
expect(FinalWrapper).toBe(FinalWrapper);

// In  libs/sherlock/src/lib/interfaces.ts:289,  the basic states a Derivable can have are shown.
// >    `export type State<V> = V | unresolved | ErrorWrapper;`
// A state can be either any type `V` (`number`, `string`, etc.), `unresolved` as we saw in the
// previous tutorial, or `ErrorWrapper`. This last state is explained here.
describe('errors', () => {
    let myAtom$: DerivableAtom<number>;

    beforeEach(() => {
        myAtom$ = atom(1);
    });

    it('basic errors', () => {
        // The `errored` property shows whether the last statement resulted in an error.
        expect(myAtom$.errored).toBe(false);
        expect(myAtom$.error).toBeUndefined; // by default, the `error` property is undefined.
        expect(myAtom$.getState()).toBe(1); // as explained above, any type can be a state

        // We can set errors using the `setError()` function.
        myAtom$.setError('my Error');

        expect(myAtom$.errored).toBe(true);
        expect(myAtom$.error).toBe('my Error');

        // The `ErrorWrapper` state only holds an error string. The `error()` function returns
        // such an `ErrorWrapper` which we can use to compare.
        expect(myAtom$.getState()).toMatchObject(error('my Error'));

        // expect(myAtom$.get).toThrow("Cannot read properties of undefined (reading 'getState')");
        // TODO: WHAT - normally this works, but internal JEST just fucks with me....?

        // Calling `get()` on `myAtom$` gives the error.
        expect(() => myAtom$.get()).toThrow('my Error');
        expect(myAtom$.errored).toBe(true);

        // ** __YOUR_TURN__ **
        // What will happen if you try to call `set()` on `myAtom$`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.set(2)).not.toThrow(); 
        expect(myAtom$.errored).toBe(false); 

        // Interestingly, calling `set()` does not throw an error. In fact, it removes the error state
        // altogether. This means we can call `get()` again.
        expect(() => myAtom$.get()).not.toThrow();
    });

    it('deriving an error', () => {
        const myDerivable$ = myAtom$.derive(v => v + 1);

        // If `myAtom$` suddenly errors...
        myAtom$.setError('division by zero');

        // ...what happens to `myDerivable$`?
        expect(myDerivable$.errored).toBe(true); 

        // If any Derivable tries to derive from an atom in an error state,
        // this Derivable will itself throw an error too. This makes sense,
        // given that it cannot obtain the value it needs anymore.
    });

    it('reacting to an error', () => {
        // Without a reactor, setting an error to an Atom does not throw an error.
        expect(() => myAtom$.setError('my Error')).not.toThrow();
        myAtom$.set(1);

        // Now we set a reactor to `myAtom$`. This reactor does not use the value of `myAtom$`.
        const reactor = jest.fn();
        myAtom$.react(reactor);

        // ** __YOUR_TURN__ **
        // Will an error be thrown when `myAtom$` is now set to an error state?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.setError('my Error')).toThrow('my Error'); 

        // Reacting to a Derivable that throws an error will make the reactor throw as well.
        // Because the reactor will usually fire when it gets connected, it also throws when
        // you try to connect it after the error has already been set.

        myAtom$ = atom(1);
        myAtom$.setError('my second Error');

        // ** __YOUR_TURN__ **
        // Will an error be thrown when you use `skipFirst`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.react(reactor, { skipFirst: true })).toThrow('my second Error'); 

        // And will an error be thrown when `from = false`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.react(reactor, { from: false })).not.toThrow(); 

        // When `from = false`, the reactor is disconnected, preventing the error message from entering.
        // `skipFirst`, on the other hand, does allow the error in, but does not trigger an update.
    });

    /**
     * Similarly to `constants` which we'll explain in tutorial 7,
     * you might want to specify that a variable cannot be updated.
     * This can be useful for the programmers themselves, to not
     * accidentally update the variable, but it can also be useful for
     * optimization. You can do this using the `final` concept.
     */
    describe('TEMP `final`', () => {
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
            expect(() => myAtom$.get()).not.toThrow(); 
            expect(() => myAtom$.set(2)).toThrow('cannot set a final derivable'); 

            // This behavior is consistent with normal variables created using `const`.
            // Alternatively, you can set a last value before setting it to `final`.
            // .toThrow() or .not.toThrow()? ↴
            expect(() => myAtom$.setFinal(2)).toThrow('cannot set a final derivable'); 

            // There is no way to 'unfinalize' a Derivable, so the only solution to reset is to
            // create a whole new Derivable.
            myAtom$ = atom(1);
            myAtom$.setFinal(2);
            expect(myAtom$.final).toBeTrue();
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
             * that a Derivable depends on become final, that Derivable itself also becomes final.
             * Similarly to `unresolved` and `error`, this chains.
             */
        });

        it('`final` State', () => {
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
            // wrappen in een atom ofzo?
        });
    });

    /**
     * It is nice to be able to have a backup plan when an error occurs.
     * The `.fallbackTo()` function allows you to specify a default value
     * whenever your Derivable gets an error state.
     */
    it('Fallback-to', () => {
        const myAtom$ = atom(0);

        /**
         * ** Your Turn **
         * Use the `.fallbackTo()` method to create a `mySafeAtom$` which
         * gets the backup value `3` when `myAtom$` gets an error state.
         */
        const mySafeAtom$ = myAtom$.fallbackTo(() => 3); 

        expect(myAtom$.getState()).toBe(0);
        expect(myAtom$.value).toBe(0);
        expect(mySafeAtom$.value).toBe(0);

        myAtom$.unset();

        expect(myAtom$.getState()).toBe(unresolved);
        expect(myAtom$.value).toBeUndefined();
        expect(mySafeAtom$.value).toBe(3);
    });

    it('TEMP Flat-map', () => {
        // const myAtom$ = atom(0);
        // const mapping = (v: any) => atom(v);
        // Sometimes you use `map()`, but the result within the `map()` is also a Derivable.
        // The result would here be a `Derivable<DerivableAtom<any>>` (hover over `derive` to see this).
        // You would have to use `.get()` to go back to a single Derivable. Similarly how `flatMap` can
        // reduce lists of lists to a single list, it can help reduce Derivables of Derivables to a
        // single Derivable. If you have something like this:
        // let myAtom$$ = myAtom$.map(n => mapping(n)).derive(v => v.get());
        // You can now rewrite it to this:
        // myAtom$$ = myAtom$.flatMap(n => mapping(n));
        // It only results in slightly shorter code.
        // TODO: right?
    });
});

/**
 * !! Final States; (finalGetter, finalMethod, getMaybeFinalState, FinalWrapper, MaybeFinalState, _isFinal, makeFinal, markFinal, .final, .finalized, setFinal...)
 * ? Lens; (libs/sherlock/src/lib/derivable/lens.ts) - map die twee kanten op kan gaan. Maar een map kan dat al? Maar hier kan
 *          je dat los definieren! Je kan gewoon `lens` ipv `var.lens`. Zelden dat je dit gebruikt. Output is een Derivable though.
 * x Lift; (libs/sherlock-utils/src/lib/lift.ts)
 * !! Peek; (libs/sherlock-utils/src/lib/peek.ts) - dan track je niet. In een derivable, deze tracked hij dan niet (ipv .get() waar het wel getracked wordt)
 * x Template; (libs/sherlock-utils/src/lib/template.ts) - to make a string using a template literal. (Uses unwrap!!)
 * / Factory; (libs/sherlock/src/lib/derivable/factories.ts) - simply contains functions to create objects, namely
 *      lens; atom; constant; derive.
 * !! Flat-map; (libs/sherlock/src/lib/derivable/mixins/flat-map.ts) - ???
 *          array:      nested arrays naar array
 *          Derivable:  gooit er derive.get() achteraan?
 *      Derivable<string> (input van inputveld). Flatmap geeft Derivable terug. Derivable<string>.flatmap() returned misschien
 *      Derivable<number>, returned dan de number. flatMap is een `derive`, maar wat hij returned haalt hij uit de Derivable.
 *      ofzoiets. Maakt code korter.
 * !! Fallback-to; - op een derivable. Als een atom `unresolved` is, dan fallt het back to this value. Ofwel, initial value, maar
 *           ook als hij later unresolved wordt, dan wordt hij dit (vaak wel initial value).
 * !! Take - react options gebruiken buiten react. In een derivable chain, halverwege die options gebruiken.
 * e.g. (from)Promise. Zodra die een waarde aanneemt kan hij niet meer veranderen.
 * Let FromPromise, FromObservable, FromEventPattern ook uit (in utils?), ToPromise, ToObservable, in praktijk ook handig.
 * FromEventPattern (haily mary, als alles niet werkt, dan dit doen).
 */
