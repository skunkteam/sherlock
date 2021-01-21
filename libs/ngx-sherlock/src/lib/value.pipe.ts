import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { atom, Derivable, unwrap } from '@skunkteam/sherlock';

/**
 * The {@link ValuePipe} can be used to unwrap `Derivable` values in templates. Like Angular's
 * [AsyncPipe]{@link https://angular.io/api/common/AsyncPipe}, the
 * [ChangeDetectorRef]{@link https://angular.io/api/core/ChangeDetectorRef} of the `@Host()` component will be `markedForCheck` whenever
 * the provided value emits a new value. Usage is as follows:
 *
 * ```html
 * <!-- both title$ and someText$ are derivable values in MyComponent class -->
 * <my-component [title]="title$ | value">
 *     <p>{{ someText$ | value }}</p>
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
    private readonly stop = this.output$.react(() => this.changeDetector.markForCheck());

    ngOnDestroy() {
        this.stop();
    }

    transform<T>(value: Derivable<T>, mode: 'sync'): T;
    transform<T>(value: Derivable<T>, mode?: 'async'): T | undefined;
    transform<T>(value: Derivable<T>, mode: 'sync' | 'async' = 'async'): T | undefined {
        this.input$.set(value);
        if (mode === 'sync') {
            return this.output$.get() as T;
        }
        return this.output$.value as T | undefined;
    }
}
