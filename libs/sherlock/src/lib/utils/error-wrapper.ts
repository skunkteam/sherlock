import { equals } from './equals';

export class ErrorWrapper {
    constructor(public readonly error: unknown) {}

    equals(other: unknown) {
        return this === other || (other instanceof ErrorWrapper && equals(this.error, other.error));
    }
}

export function error(err: unknown) {
    return new ErrorWrapper(err);
}
