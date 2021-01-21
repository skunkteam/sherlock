import { sherlockInstances } from '../symbols';

export function runGlobalStateWarning() {
    // istanbul ignore next: it is impossible to test a window global in a Node process.
    const globalState = (typeof window !== 'undefined' ? window : global) as { [sherlockInstances]?: number };
    const instances = (globalState[sherlockInstances] = (globalState[sherlockInstances] ?? 0) + 1);
    if (instances > 1) {
        console.warn(`${instances} instances of Sherlock detected. This could cause unexpected results.`);
    }
}
