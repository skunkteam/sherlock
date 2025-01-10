import { TestEnvironment } from 'jest-environment-jsdom';
import { ReadableStream, WritableStream } from 'stream/web';
import { TextDecoder, TextEncoder } from 'util';

/**
 * Extend the default jest-jsdom test environment to make TextDecoder/-Encoder and fetch API globally available. This fixes the issue
 * where those classes/functions can't be found when it's being called from frontend unit tests.
 *
 * @see [bufbuild](https://github.com/bufbuild/jest-environment-jsdom)
 */
export default class JsdomModernEnvironment extends TestEnvironment {
    async setup() {
        await super.setup();

        this.global.TextDecoder ??= TextDecoder;
        this.global.TextEncoder ??= TextEncoder;
        this.global.fetch ??= fetch;
        this.global.Request ??= Request;
        this.global.Response ??= Response;
        this.global.ReadableStream ??= ReadableStream;
        this.global.WritableStream ??= WritableStream;
    }
}
