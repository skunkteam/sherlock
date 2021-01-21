import { resolveFallback } from './lib/derivable';
import { clone, equals, isPlainObject } from './lib/utils';
import { runGlobalStateWarning } from './lib/utils/multiple-instances-warning';

export * as _internal from './internal';
export {
    atom,
    constant,
    derive,
    isDerivable,
    isDerivableAtom,
    isSettableDerivable,
    lens,
    PullDataSource,
    safeUnwrap,
    unwrap,
} from './lib/derivable';
export type {
    Derivable,
    DerivableAtom,
    Fallback,
    LensDescriptor,
    ReactorOptions,
    SettableDerivable,
    State,
    TakeOptionValue,
    ToPromiseOptions,
    Unwrappable,
} from './lib/interfaces';
export { unresolved } from './lib/symbols';
export { atomic, atomically, inTransaction, transact, transaction } from './lib/transaction';
export { config, ErrorWrapper, FinalWrapper } from './lib/utils';

export const utils = {
    clone,
    equals,
    isPlainObject,
    resolveFallback,
};

runGlobalStateWarning();
