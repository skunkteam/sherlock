import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { atom, Derivable, unwrap } from '@skunkteam/sherlock';
import { materialize } from '@skunkteam/sherlock-utils';

/**
 * The {@link ValuePipe} can be used to unwrap `Derivable` values in templates. Like Angular's
 * [AsyncPipe](https://angular.io/api/common/AsyncPipe), the change-detector of the host-component
 * will be `markedForCheck` whenever the provided value emits a new value. Usage is as follows:
 *
 * ```html
 * <!-- both title$ and someText$ are derivable values in MyComponent class -->
 * <my-component [title]="title$ | value">
 *     <p>{{ someText$ | value }}</p>
 * </my-component>
 * ```
 *
 * By default the `value` pipe returns `undefined` when the input derivable is `unresolved`. It is
 * currently not possible to determine whether a Derivable can be unresolved by looking at the type,
 * so the return-type of the pipe is by default: `T | undefined`. If you are sure that your derivable
 * cannot be unresolved and you don't want to handle the `undefined` return-type, you can put the pipe
 * in `sync` mode. It will then throw when de Derivable is unresolved, instead of returning `undefined`.
 * This is reflected in the return-type.
 *
 * Example:
 * ```html
 * <!-- if we know title$ will never be unresolved and [title] does not accept undefined: -->
 * <my-component [title]="title$ | value:'sync'">
 *     ...
 * </my-component>
 * ```
 */
@Pipe({
    name: 'value',
    pure: false,
})
export class ValuePipe implements PipeTransform, OnDestroy {
    constructor(private readonly changeDetector: ChangeDetectorRef) {}

    private readonly input$ = atom.unresolved<Derivable<unknown>>();
    private readonly output$ = this.input$.derive(unwrap);
    private readonly stop = materialize(this.output$).react(
        m => {
            if (m.errored) console.error('Error in input-derivable to ValuePipe:', m.error);
            this.changeDetector.markForCheck();
        },
        { skipFirst: true },
    );

    ngOnDestroy() {
        this.stop();
    }

    transform<T>(value: Derivable<T>, mode: 'sync'): T;
    transform<T>(value: Derivable<T>, mode?: 'async'): T | undefined;
    transform<T>(value: Derivable<T>, mode: 'sync' | 'async' = 'async'): T | undefined {
        this.input$.set(value);
        if (this.output$.errored) {
            // Simply return undefined on error, the reactor above will log the error.
            return undefined;
        }
        if (mode === 'sync') {
            return this.output$.get() as T;
        }
        return this.output$.value as T | undefined;
    }
}
