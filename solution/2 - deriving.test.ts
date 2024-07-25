import { atom, Derivable, derive } from '@skunkteam/sherlock';

/**
 * Any `Derivable` (including `Atom`s) can be used (and/or combined) to create
 * a derived state. This derived state is in turn a `Derivable`.
 *
 * There are a couple of ways to do this.
 */
describe('deriving', () => {
    /**
     * In the 'intro' we have created a derivable by using the `.derive()` method.
     * This method allows the state of that `Derivable` to be used to create a
     * new `Derivable`.
     *
     * In the derivation, other `Derivable`s can be used as well.
     * If a `Derivable.get()` is called inside a derivation, the changes to that
     * `Derivable` are also tracked and kept up to date.
     */
    it('combining `Derivable`s', () => {
        const repeat$ = atom(1);
        const text$ = atom(`It won't be long`);

        /**
         * ** Your Turn **
         *
         * Let's create some lyrics by combining `text$` and `repeat$`.
         * As you might have guessed, we want to repeat the text a couple of times.
         *
         * (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat should do fine)
         */

        // We can combine txt with `repeat$.get()` here.
        const lyric$ = text$.derive(txt => txt.repeat(repeat$.get())); 

        expect(lyric$.get()).toEqual(`It won't be long`);

        text$.set(' yeah');
        repeat$.set(3);
        expect(lyric$.get()).toEqual(` yeah yeah yeah`);
    });

    /**
     * Now that we have used `.get()` in a `.derive()`. You may wonder, can
     * we skip the original `Derivable` and just call the function `derive()`?
     *
     * Of course you can!
     *
     * And you can use any `Derivable` you want, even if they all have the same
     * `Atom` as a parent.
     */
    it('the `derive()` function', () => {
        const myCounter$ = atom(1);

        /**
         * ** Your Turn **
         *
         * Let's try creating a `Derivable` [FizzBuzz](https://en.wikipedia.org/wiki/Fizz_buzz).
         * `fizzBuzz$` should combine `fizz$`, `buzz$` and `myCounter$` to
         * produce the correct output.
         *
         * Multiple `Derivable`s can be combined to create a new one. To do
         * this, just use `.get()` on (other) `Derivable`s in the `.derive()`
         * step.
         *
         * This can be done both when `derive()` is used standalone or as a
         * method on another `Derivable`.
         */

        // Should return 'Fizz' when `myCounter$` is a multiple of 3 and '' otherwise.
        const fizz$: Derivable<string> = myCounter$.derive(v => (v % 3 ? '' : 'Fizz')); // Shorthand for `v % 3 !== 0`

        // Should return 'Buzz' when `myCounter$` is a multiple of 5 and '' otherwise.
        const buzz$: Derivable<string> = myCounter$.derive(v => (v % 5 ? '' : 'Buzz'));

        const fizzBuzz$: Derivable<string | number> = derive(() => fizz$.get() + buzz$.get() || myCounter$.get());

        expect(fizz$.get()).toEqual('');
        expect(buzz$.get()).toEqual('');
        expect(fizzBuzz$.get()).toEqual(1);
        for (let count = 1; count <= 100; count++) {
            // Set the value of the `Atom`,
            myCounter$.set(count);

            // and check if the output changed accordingly.
            checkFizzBuzz(count, fizzBuzz$.get());
        }
    });

    function checkFizzBuzz(count: number, out: string | number) {
        if ((count % 3) + (count % 5) === 0) {
            // If `count` is a multiple of 3 AND 5, output 'FizzBuzz'.
            expect(out).toEqual('FizzBuzz');
        } else if (count % 3 === 0) {
            // If `count` is a multiple of 3, output 'Fizz'.
            expect(out).toEqual('Fizz');
        } else if (count % 5 === 0) {
            // If `count` is a multiple of 5, output 'Buzz'.
            expect(out).toEqual('Buzz');
        } else {
            // Otherwise just output the `count` itself.
            expect(out).toEqual(count);
        }
    }

    /**
     * The automatic tracking of `.get()` calls will also happen inside called
     * `function`s.
     *
     * This can be really powerful, but also dangerous. One of the dangers is
     * shown here.
     */
    it('indirect derivations', () => {
        const pastTweets = [] as string[];
        const currentUser$ = atom('Barack');
        const tweet$ = atom('First tweet');

        function log(tweet: string) {
            pastTweets.push(`${currentUser$.get()} - ${tweet}`);
        }

        tweet$.derive(log).react(txt => {
            // Normally we would do something with the tweet here.
            return txt;
        });

        // The first tweet should have automatically been added to the `pastTweets` array.
        expect(pastTweets).toHaveLength(1);
        expect(pastTweets[0]).toContain('Barack');
        expect(pastTweets[0]).toContain('First tweet');

        // Let's add a famous quote by Mr Barack:
        tweet$.set('We need to reject any politics that targets people because of race or religion.');
        // As expected this is automatically added to the log.
        expect(pastTweets).toHaveLength(2);
        expect(pastTweets[1]).toContain('Barack');
        expect(pastTweets[1]).toContain('reject');

        // But what if the user changes?
        currentUser$.set('Donald');

        /**
         * ** Your Turn **
         *
         * Time to set your own expectations.
         */
        const tweetCount = pastTweets.length;
        const lastTweet = pastTweets[tweetCount - 1];

        expect(tweetCount).toEqual(3); // Is there a new tweet?
        expect(lastTweet).toContain('Donald'); // Who sent it? Donald? Or Barack?
        expect(lastTweet).toContain('politics'); // What did he tweet?

        /**
         * As you can see, this is something to look out for.
         * Luckily there are ways to circumvent this. But more on that later.
         *
         * * Note that this behavior can also be really helpful if you know what
         *   you are doing *
         */
    });

    /**
     * Every `Derivable` has a couple of convenience methods.
     * These are methods that make common derivations a bit easier.
     *
     * These methods are: `.and()`, `.or()`, `.is()` and `.not()`.
     *
     * Their function is as you would expect from `boolean` operators in a
     * JavaScript environment.
     *
     * The first three will take a `Derivable` or regular value as parameter.
     * `.not()` does not need any input.
     *
     * `.is()` will resolve equality in the same way as `@skunkteam/sherlock`
     * would do internally.
     *
     * More on the equality check in the 'inner workings' part. But know that
     * the first check is [Object.is()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)
     */
    it('convenience methods', () => {
        const myCounter$ = atom(1);

        /**
         * ** Your Turn **
         *
         * The FizzBuzz example above can be rewritten using the convenience
         * methods. This is not how you would normally write it, but it looks
         * like a fun excercise.
         *
         * `fizz$` and `buzz$` can be completed with only `.is(...)`,
         * `.and(...)` and `.or(...)`. Make sure the output of those `Derivable`s
         * is either 'Fizz'/'Buzz' or ''.
         */
        const fizz$ = myCounter$
            .derive(count => count % 3)
            .is(0)
            .and('Fizz')
            .or('');

        const buzz$ = myCounter$
            .derive(count => count % 5)
            .is(0)
            .and('Buzz')
            .or('');

        const fizzBuzz$ = derive(() => fizz$.get() + buzz$.get()).or(myCounter$); 
        // This will check whether `fizz$.get() + buzz$.get()` is truthy: if so, return it; if not, return `myCounter$` 

        for (let count = 1; count <= 100; count++) {
            // Set the value of the `Atom`,
            myCounter$.set(count);

            // and check if the output changed accordingly.
            checkFizzBuzz(count, fizzBuzz$.get());
        }
    });
});
