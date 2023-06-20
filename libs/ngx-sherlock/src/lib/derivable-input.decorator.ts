import { atom, Derivable, SettableDerivable } from '@skunkteam/sherlock';

/**
 * The {@link DerivableInput} can be used in conjunction with an Angular
 * [Input](https://angular.io/api/core/Input) when it expects a `Derivable` value.
 * When `@DerivableInput()` is used a compatible (`unresolved`) `Derivable` is presented when
 * accessing this property. Any `Derivable` set by the `@Input()` binding will be flattened into
 * this `Derivable`.
 *
 * This prevents the awkward situation where a `Component` expects a `Derivable` as `Input`, but
 * cannot use any operators on that `Derivable` directly, because it is not present when the class
 * is constructed.
 *
 * @example
 * ```ts
 * @Component({ ... })
 * export class MyComponent {
 *      // non-null-assertion can be used here, because `@DerivableInput()` guarantees a `Derivable`
 *      // to be present
 *      @Input() @DerivableInput() myVal$!: Derivable<number>;
 *
 *     // `this.myVal$` can be used this way now
 *     readonly timesTwo$ = this.myVal$.map(val => 2 * val);
 * }
 * ```
 */
export function DerivableInput() {
    return <Key extends string | number>(proto: Record<Key, Derivable<unknown>>, key: Key) => {
        const inputKey = Symbol(`_${key}Input$`);
        const flatKey = Symbol(`_${key}Flattened$`);

        Object.defineProperty(proto, key, {
            set(val) {
                getInput$(this).set(val);
            },
            get() {
                return (this[flatKey] ??= getInput$(this).flatMap(d => d));
            },
        });
        function getInput$(instance: Record<typeof inputKey, SettableDerivable<Derivable<unknown>>>) {
            return (instance[inputKey] ??= atom.unresolved<Derivable<unknown>>());
        }
    };
}
