import { MaybeFinalState } from '../interfaces';
import { clone } from './clone';
import { config } from './config';
import { ErrorWrapper } from './error-wrapper';
import { FinalWrapper } from './final-wrapper';

export interface ObjectWithCreationStack {
    creationStack?: string;
}

export function augmentStack(err: unknown, obj: ObjectWithCreationStack) {
    const { creationStack } = obj;
    if (!creationStack || !hasStack(err)) {
        return err;
    }
    return Object.defineProperty(clone(err), 'stack', {
        value: `${err.stack}\n${creationStack}`,
    });
}

export function augmentState<V>(state: MaybeFinalState<V>, obj: ObjectWithCreationStack): MaybeFinalState<V> {
    if (state instanceof FinalWrapper) {
        const newValue = augmentState<V>(state.value, obj);
        if (newValue !== state.value) {
            return FinalWrapper.wrap(newValue);
        }
    }
    if (obj.creationStack && state instanceof ErrorWrapper) {
        return new ErrorWrapper(augmentStack(state.error, obj));
    }
    return state;
}

export function prepareCreationStack(obj: object) {
    if (config.debugMode) {
        const stack = new Error().stack;
        return `${obj.constructor.name} created:\n${stack && stack.substr(stack.indexOf('\n') + 1)}`;
    }
    return;
}

function hasStack(obj: unknown): obj is { stack: string } {
    return typeof obj === 'object' && !!obj && typeof (obj as any).stack === 'string';
}
