import type { Derivable, ReactorOptions } from '../interfaces';

let currentReactorTest: { reactions: number; value: unknown };
export function react<V>(d: Derivable<V>, opts?: Partial<ReactorOptions<V>>) {
    currentReactorTest = { reactions: 0, value: undefined };
    return d.react(v => {
        currentReactorTest.reactions++;
        currentReactorTest.value = v;
    }, opts);
}

afterEach(() => (currentReactorTest = undefined as any));

export function shouldNotHaveReacted() {
    expect(currentReactorTest.reactions).toBe(0);
    currentReactorTest.reactions = 0;
}

export function shouldHaveReactedOnce(value: unknown) {
    expect(currentReactorTest.reactions).toBe(1);
    expect(currentReactorTest.value).toBe(value);
    currentReactorTest.reactions = 0;
}
