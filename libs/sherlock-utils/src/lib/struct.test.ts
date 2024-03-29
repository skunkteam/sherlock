import { atom } from '@skunkteam/sherlock';
import { parallelStruct, struct } from './struct';

describe.each([
    [struct, 'serial'],
    [parallelStruct, 'parallel'],
])('sherlock-utils/%p', (fn, mode) => {
    test(`should activate derivables in ${mode}`, () => {
        const parts = [1, 2, 3].map(() => atom.unresolved<number>());
        const result = fn(parts).autoCache();

        expect(result.resolved).toBeFalse();
        expect(parts.map(d$ => d$.connected)).toEqual([true, mode === 'parallel', mode === 'parallel']);
    });

    it('should copy any value-type as-is', () => {
        const obj = {
            date: new Date(),
            number: 123,
            string: 'asdf',
            strings: ['asdf', 'sdfg'],
        };
        const result = fn(obj).get();
        expect(result).toEqual(obj);
        expect(result.date).toBe(obj.date);
    });

    it('should return a Derivables as is', () => {
        const a = atom(123);
        expect(fn(a)).toBe(a);
    });

    it('should turn an array of derivables into an unwrapped derivable', () => {
        const number1$ = atom(1);
        const number2$ = atom(2);
        const number3$ = number1$.derive(n => n + number2$.get());

        const number$s = [number1$, number2$, number3$];
        const numbers$ = fn(number$s);

        expect(numbers$.get()).toEqual([1, 2, 3]);

        number2$.set(3);
        expect(numbers$.get()).toEqual([1, 3, 4]);
    });

    it('should turn a map of derivables into an unwrapped derivable', () => {
        const name$ = atom('Edwin');
        const tel$ = atom('0612345678');
        const person = { name: name$, tel: tel$ };
        const person$ = fn(person);

        expect(person$.get()).toEqual({ name: 'Edwin', tel: '0612345678' });

        tel$.set('n/a');

        expect(person$.get()).toEqual({ name: 'Edwin', tel: 'n/a' });
    });

    it('should turn any nested structure of maps and arrays into an unwrapped derivable', () => {
        const name$ = atom('Edwin');
        const tel$ = atom('0612345678');
        const friendName$ = atom('Peter');
        const friendTel$ = atom('0698765432');

        const obj = {
            name: name$,
            tel: tel$,
            friends: [
                {
                    name: friendName$,
                    tel: friendTel$,
                },
            ],
        };
        const nested$ = fn(obj).autoCache();

        expect(nested$.get()).toEqual({
            name: 'Edwin',
            tel: '0612345678',
            friends: [
                {
                    name: 'Peter',
                    tel: '0698765432',
                },
            ],
        });

        friendTel$.set('changed but did not tell');

        expect(nested$.get()).toEqual({
            name: 'Edwin',
            tel: '0612345678',
            friends: [
                {
                    name: 'Peter',
                    tel: 'changed but did not tell',
                },
            ],
        });
    });

    it('should infer the correct types', () => {
        const a$ = atom('a');
        const b$ = a$.derive(v => v.length);
        const object = { a$, b$ };
        const readonlyObject = { a$, b$ } as const;
        const array = [a$, b$];
        const readonlyArray = [a$, b$] as const;
        const d$ = fn({ object, readonlyObject, array, readonlyArray });

        const result = d$.get();

        type ExpectedType = {
            object: { a$: string; b$: number };
            readonlyObject: { a$: string; b$: number };
            array: readonly (string | number)[];
            readonlyArray: readonly [string, number];
        };

        assignableTo<ExpectedType>(result);
        assignableTo<typeof result>({} as ExpectedType);
        // @ts-expect-error check that result is not `any`
        assignableTo<typeof result>(0 as unknown);
    });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assignableTo<T>(_val: T) {
    // nothing here
}
