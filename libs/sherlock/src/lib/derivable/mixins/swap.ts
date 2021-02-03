import type { SafeUnwrapTuple, SettableDerivable } from '../../interfaces';
import { safeUnwrap } from '../unwrap';

export function swapMethod<V, PS extends unknown[]>(
    this: SettableDerivable<V>,
    f: (oldValue: V | undefined, ...args: SafeUnwrapTuple<PS>) => V,
    ...args: PS
) {
    this.set(f(this.value, ...(args.map(safeUnwrap) as SafeUnwrapTuple<PS>)));
}
