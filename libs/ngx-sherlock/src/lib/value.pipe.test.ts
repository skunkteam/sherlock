import type { ChangeDetectorRef } from '@angular/core';
import { atom, DerivableAtom } from '@skunkteam/sherlock';
import { ValuePipe } from './value.pipe';

describe(ValuePipe, () => {
    let ref: ChangeDetectorRef;
    let pipe: ValuePipe;
    let emitter: DerivableAtom<string>;

    beforeEach(() => {
        ref = { markForCheck: jest.fn() } as unknown as ChangeDetectorRef;
        pipe = new ValuePipe(ref);
        emitter = atom.unresolved();
    });

    describe(ValuePipe.prototype.transform, () => {
        afterEach(() => {
            pipe.ngOnDestroy();
        });

        it('should return the current value of a Derivable', () => {
            emitter.set('here I am!');
            expect(pipe.transform(emitter)).toBe('here I am!');
        });

        it('should not throw on unresolved derivables by default', () => {
            expect(pipe.transform(emitter)).toBeUndefined();
            emitter.set('here I am!');
            expect(pipe.transform(emitter)).toBe('here I am!');
        });

        it('should throw on unresolved derivables in "sync" mode', () => {
            expect(() => pipe.transform(emitter, 'sync')).toThrow('derivable is unresolved');
            emitter.set('here I am!');
            expect(pipe.transform(emitter, 'sync')).toBe('here I am!');
        });

        it('should never throw on errored derivables', () => {
            emitter.setError('the error, oh no!');
            jest.spyOn(console, 'error').mockReturnValueOnce();

            expect(pipe.transform(emitter)).toBeUndefined();
            expect(pipe.transform(emitter, 'sync')).toBeUndefined();
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith('Error in input-derivable to ValuePipe:', 'the error, oh no!');
        });

        it('should dispose of the existing reaction when reacting to a new derivable', () => {
            pipe.transform(emitter);

            expect(emitter.observerCount).toBe(1);

            const newEmitter = atom.unresolved();
            expect(pipe.transform(newEmitter)).toBe(undefined);

            emitter.set('newer value'); // this should not affect the pipe instance
            expect(emitter.observerCount).toBe(0);
            expect(newEmitter.observerCount).toBe(1);
        });

        it('should request a change detection check upon receiving a new value', () => {
            pipe.transform(emitter);

            expect(ref.markForCheck).not.toHaveBeenCalled();

            emitter.set('do check');

            expect(ref.markForCheck).toHaveBeenCalled();
        });

        it('should request change detection check upon becoming `unresolved`', () => {
            pipe.transform(emitter);

            expect(ref.markForCheck).not.toHaveBeenCalled();

            emitter.set('do check');

            expect(ref.markForCheck).toHaveBeenCalledTimes(1);

            emitter.unset();

            expect(ref.markForCheck).toHaveBeenCalledTimes(2);

            emitter.set('do check'); // Same value as before

            expect(ref.markForCheck).toHaveBeenCalledTimes(3);
        });

        it('should request change detection check upon becoming errored', () => {
            jest.spyOn(console, 'error').mockReturnValue(); // prevent error logs in the test

            pipe.transform(emitter);

            expect(ref.markForCheck).not.toHaveBeenCalled();

            emitter.setError('the error, oh no!');

            expect(ref.markForCheck).toHaveBeenCalledTimes(1);

            emitter.setError('another error, oh no!');

            expect(ref.markForCheck).toHaveBeenCalledTimes(2);
        });
    });

    describe(ValuePipe.prototype.ngOnDestroy, () => {
        it('should do nothing when there is no reaction', () => {
            expect(() => pipe.ngOnDestroy()).not.toThrow();
        });

        it('should unsubscribe on the derivable', () => {
            pipe.transform(emitter);
            expect(emitter.observerCount).toBe(1);

            pipe.ngOnDestroy();
            expect(emitter.observerCount).toBe(0);
        });
    });
});
