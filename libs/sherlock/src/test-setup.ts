import 'jest-extended/all';
import './index';

declare global {
    export function assignableTo<T>(value: T): void;
}

(global as any).assignableTo = function () {
    /* intentionally left blank */
};
