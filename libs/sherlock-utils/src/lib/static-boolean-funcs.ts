import { Derivable, derive, unwrap } from '@skunkteam/sherlock';

/**
 * Performs JavaScript `&&` operation on the provided arguments after unwrapping.
 *
 * @method
 */
export const and = andOrImpl(v => !v);

/**
 * Performs JavaScript `||` operation on the provided arguments after unwrapping.
 *
 * @method
 */
export const or = andOrImpl(v => !!v);

/**
 * Returns the first operand that is not `null` or `undefined` after unwrapping.
 *
 * @method
 */
export const firstNotNull = andOrImpl(v => v != null);

function andOrImpl(breakOn: (v: any) => boolean) {
    return <V>(...args: Array<Derivable<V> | V>) =>
        derive(() => {
            let value: V;
            for (const arg of args) {
                value = unwrap(arg);
                if (breakOn(value)) {
                    break;
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return value!;
        });
}
