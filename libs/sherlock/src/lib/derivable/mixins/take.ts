import type { Derivable, MaybeFinalState, TakeOptions, TakeOptionValue } from '../../interfaces';
import { unresolved } from '../../symbols';
import { equals, ErrorWrapper, final, FinalWrapper } from '../../utils';
import { Atom } from '../atom';
import { Derivation } from '../derivation';
import { isDerivable } from '../typeguards';
import { unwrap } from '../unwrap';

const true$ = new Atom(final(true));
const false$ = new Atom(final(false));
const skipped = Symbol('skipped');
const finalSkipped = final(skipped);

export function takeMethod<V>(
    this: Derivable<V>,
    { from, when, until, once, stopOnError, skipFirst }: Partial<TakeOptions<V>>,
): Derivable<V> {
    // From is true by default, once it becomes true, it will stay true.
    const from$ = toMaybeDerivable(from, this, true, true);
    // When is true by default.
    const when$ = toMaybeDerivable(when, this, true);
    // Until is false by default, once it becomes true, it will stay true.
    const until$ = toMaybeDerivable(until, this, false, true);
    // SkipFirst is false by default, once it becomes false again, it will stay false.
    const skipFirstState$ = skipFirst ? new Atom<MaybeFinalState<V> | typeof skipped>(unresolved) : undefined;

    if (!from$ && !when$ && !until$ && !once && !stopOnError && !skipFirstState$) {
        return this;
    }

    const previousState$ = (until$ || when$) && new Atom<V>(unresolved);
    function resultingState(value: MaybeFinalState<V>) {
        previousState$?.set(value);
        return value;
    }

    return new Derivation<V>(() => {
        if (from$ && !from$.get()) {
            return unresolved;
        }
        if (until$ && until$.get()) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return resultingState(final(previousState$!._value));
        }
        if (when$ && !when$.getOr(false)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return previousState$!._value;
        }
        const state = this.getMaybeFinalState();
        if (skipFirstState$ && !finalSkipped.equals(skipFirstState$._value)) {
            if (!isValue(state)) {
                return resultingState(state);
            }
            if (skipFirstState$._value === unresolved || equals(state, skipFirstState$._value)) {
                skipFirstState$.set(state);
                return resultingState(unresolved);
            }
            skipFirstState$.set(finalSkipped);
        }
        return resultingState(
            (once && isValue(state)) || (stopOnError && state instanceof ErrorWrapper) ? final(state) : state,
        );
    });
}

function toMaybeDerivable<V>(
    option: TakeOptionValue<V> | undefined,
    derivable: Derivable<V>,
    defaultValue: boolean,
    finalValue?: boolean,
) {
    if (option === undefined) {
        return;
    }
    const knownConstant = option ? true$ : false$;
    if (isAlwaysEqualTo(option, defaultValue)) {
        return;
    }
    if (typeof option === 'function') {
        const fn = option;
        option = new Derivation(() => fn(derivable)).derive(unwrap);
    }
    if (isDerivable(option)) {
        return finalValue !== undefined ? option.mapState<boolean>(v => (v === finalValue ? final(v) : v)) : option;
    }
    return knownConstant;
}

function isValue<V>(state: MaybeFinalState<V>): state is V | FinalWrapper<V> {
    const s = FinalWrapper.unwrap(state);
    return s !== unresolved && !(s instanceof ErrorWrapper);
}

function isAlwaysEqualTo(option: unknown, value: unknown) {
    return (
        option === value ||
        (option instanceof Atom && option._value instanceof FinalWrapper && option._value.value === value)
    );
}
