import { atom, derive, lens } from './derivable';
import type { Derivable, SettableDerivable } from './interfaces';

const string$ = atom('value' as const);
const number$ = atom(1 as const);
const boolean$ = atom(false as const);

describe('Derivable and friends', () => {
    test('#or/and', () => {
        const lotOfLiterals$ = atom<'abc' | '' | boolean | 0 | 1 | null | undefined>('');
        const singleLiteral$ = atom<'single value'>('single value');

        assignableTo<'single value' | 'abc' | true | 1>(lotOfLiterals$.or(singleLiteral$).get());
        // We are not able to filter out `1` here without filtering out `NaN`, which wouldn't be correct:
        assignableTo<'single value' | '' | false | 0 | 1 | null | undefined>(lotOfLiterals$.and(singleLiteral$).get());
    });

    test('#pluck', () => {
        const obj = { some: 'literal type' } as const;
        const settable$ = atom(obj);

        assignableTo<SettableDerivable<'literal type'>>(settable$.pluck('some'));
        assignableTo<SettableDerivable<unknown>>(settable$.pluck('other'));
        // @ts-expect-error an unknown pluck-key results in a (Settable)Derivable<unknown>
        assignableTo<SettableDerivable<string>>(settable$.pluck('xxx'));

        const nonSettable$ = atom.final(obj);
        assignableTo<Derivable<'literal type'>>(nonSettable$.pluck('some'));
        // @ts-expect-error plucking a non-settable Derivable results in a non-settable Derivable.
        assignableTo<SettableDerivable<'literal type'>>(nonSettable$.pluck('some'));
    });

    test('#derive', () => {
        string$.derive(
            (str, num, bool) => {
                assignableTo<'value'>(str);
                assignableTo<1>(num);
                assignableTo<false>(bool);

                assignableTo<typeof str>('value');
                assignableTo<typeof num>(1);
                assignableTo<typeof bool>(false);
            },
            number$,
            boolean$,
        );
    });
});

describe('factories', () => {
    test('derive', () => {
        derive(
            (str, num, bool) => {
                assignableTo<'value'>(str);
                assignableTo<1>(num);
                assignableTo<false>(bool);

                assignableTo<typeof str>('value');
                assignableTo<typeof num>(1);
                assignableTo<typeof bool>(false);
            },
            string$,
            number$,
            boolean$,
        );
    });

    test('lens', () => {
        const stringLens$ = lens({ get: () => 'abc', set: () => 0 });
        assignableTo<SettableDerivable<string>>(stringLens$);
        const numberLens$ = lens<number, [number]>({ get: a => a, set: () => 0 }, 123);
        assignableTo<SettableDerivable<number>>(numberLens$);
        const booleanLens$ = lens<boolean, [boolean]>({ get: a => a, set: () => 0 }, atom(false));
        assignableTo<SettableDerivable<boolean>>(booleanLens$);

        const lens$ = lens<string, ['value', 1, false]>(
            {
                get: (str, num, bool) => {
                    assignableTo<'value'>(str);
                    assignableTo<1>(num);
                    assignableTo<false>(bool);

                    assignableTo<typeof str>('value');
                    assignableTo<typeof num>(1);
                    assignableTo<typeof bool>(false);
                    return 'a string';
                },
                set: (oldValue: string, str, num, bool) => {
                    assignableTo<string>(oldValue);
                    assignableTo<'value'>(str);
                    assignableTo<1>(num);
                    assignableTo<false>(bool);

                    assignableTo<typeof str>('value');
                    assignableTo<typeof num>(1);
                    assignableTo<typeof bool>(false);
                },
            },
            string$,
            number$,
            boolean$,
        );

        assignableTo<SettableDerivable<string>>(lens$);
    });
});
