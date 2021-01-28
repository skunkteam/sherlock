import { atom } from '@skunkteam/sherlock';
import { struct } from './struct';

describe('sherlock-utils/struct', () => {
    it('should copy any value-type as-is', () => {
        const obj = {
            date: new Date(),
            number: 123,
            string: 'asdf',
            strings: ['asdf', 'sdfg'],
        };
        const result = struct(obj).get();
        expect(result).toEqual(obj);
        expect(result.date).toBe(obj.date);
    });

    it('should return a Derivables as is', () => {
        const a = atom(123);
        expect(struct(a)).toBe(a);
    });

    it('should turn an array of derivables into an unwrapped derivable', () => {
        const number1$ = atom(1);
        const number2$ = atom(2);
        const number3$ = number1$.derive(n => n + number2$.get());

        const number$s = [number1$, number2$, number3$];
        const numbers$ = struct(number$s);

        expect(numbers$.get()).toEqual([1, 2, 3]);

        number2$.set(3);
        expect(numbers$.get()).toEqual([1, 3, 4]);
    });

    it('should turn a map of derivables into an unwrapped derivable', () => {
        const name$ = atom('Edwin');
        const tel$ = atom('0612345678');
        const person = { name: name$, tel: tel$ };
        const person$ = struct(person);

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
        const nested$ = struct(obj).autoCache();

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
});
