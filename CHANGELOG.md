# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [6.2.0](https://github.com/skunkteam/sherlock/compare/v6.1.0...v6.2.0) (2022-02-21)

### Features

-   **sherlock:** add `resolved$`, `errored$` and `not$` getters to all Derivables ([#23](https://github.com/skunkteam/sherlock/issues/23)) ([34a7802](https://github.com/skunkteam/sherlock/commit/34a780239d5eb5d94a0d4223b4b86019218b2884))

## [6.1.0](https://github.com/skunkteam/sherlock/compare/v6.0.2...v6.1.0) (2021-09-20)

### Features

-   **ngx-sherlock:** Add `@DerivableInput()` to ngx-sherlock ([#22](https://github.com/skunkteam/sherlock/issues/22)) ([7b34076](https://github.com/skunkteam/sherlock/commit/7b34076e198d9bf31e9706fe60c1b9db66db722e))

### [6.0.2](https://github.com/skunkteam/sherlock/compare/v6.0.1...v6.0.2) (2021-03-22)

### Bug Fixes

-   **ngx-sherlock:** fix behavior of ValuePipe on errored derivables ([#20](https://github.com/skunkteam/sherlock/issues/20)) ([4050b23](https://github.com/skunkteam/sherlock/commit/4050b2388224389453786738140b9db95382b37e))
-   **sherlock-utils:** fix typings-bug in `struct` where readonly arrays are not unwrapped in result type ([#19](https://github.com/skunkteam/sherlock/issues/19)) ([5c978c3](https://github.com/skunkteam/sherlock/commit/5c978c36f4b8860787e6022a2b451746ab5aff69))

### [6.0.1](https://github.com/skunkteam/sherlock/compare/v6.0.0...v6.0.1) (2021-02-18)

### Bug Fixes

-   **ngx-sherfire:** use firebase production build instead of development build ([#18](https://github.com/skunkteam/sherlock/issues/18)) ([f84ce4c](https://github.com/skunkteam/sherlock/commit/f84ce4c785430a4f68173e542db671b5b851320c))

## [6.0.0](https://github.com/skunkteam/sherlock/compare/v6.0.0-rc.1...v6.0.0) (2021-02-17)

## [6.0.0-rc.1](https://github.com/skunkteam/sherlock/compare/v6.0.0-rc.0...v6.0.0-rc.1) (2021-02-16)

### Bug Fixes

-   **ngx-sherfire:** ensure FirebaseUser$ updates even when User object is reused by Firebase SDK ([#17](https://github.com/skunkteam/sherlock/issues/17)) ([18f4073](https://github.com/skunkteam/sherlock/commit/18f407374af766e4c76a9327167316fad403f5c9))

## [6.0.0-rc.0](https://github.com/skunkteam/sherlock/compare/v5.0.0...v6.0.0-rc.0) (2021-02-15)

### ⚠ BREAKING CHANGES

-   **sherlock:** As all Derivables are now compatible with rxjs's `from` function, we no longer need the `toObservable` function from `@skunkteam/sherlock-rxjs`. All usages of `toObservable` should be replaced with `from`. The remaining function `fromObservable` from `@skunkteam/sherlock-rxjs` is promoted to `@skunkteam/sherlock-utils`. From now on `@skunkteam/sherlock-rxjs` will no longer receive updates.
-   **sherlock:** The typings now correctly identify the use of `safeUnwrap` for all extra arguments when using `SettableDerivable#swap`, leading to a breaking change in the interface of `SettableDerivable`.
-   **sherlock-utils:** improved/simplified derivableCache API

### Features

-   **ngx-sherfire:** introduce @skunkteam/ngx-sherfire ([#16](https://github.com/skunkteam/sherlock/issues/16)) ([5c1edb9](https://github.com/skunkteam/sherlock/commit/5c1edb9ce2b830c8fa8607a4a07fdaf9fb652ad1))
-   **ngx-sherlock:** export ValuePipe from bundle ([#6](https://github.com/skunkteam/sherlock/issues/6)) ([6cc388d](https://github.com/skunkteam/sherlock/commit/6cc388d9a836b9244fcea23b9ab621b1b21fd6c7))
-   **sherlock:** add dependencyCount and observerCount to all Derivables ([#7](https://github.com/skunkteam/sherlock/issues/7)) ([1d027fc](https://github.com/skunkteam/sherlock/commit/1d027fc163dbf95ee0b8305cb673f1473b42b4e7))
-   **sherlock:** add makeFinal method ([#9](https://github.com/skunkteam/sherlock/issues/9)) ([5961ad9](https://github.com/skunkteam/sherlock/commit/5961ad90cb4ea10f2a52b80e6d45cf558f215cbf))
-   **sherlock:** All Derivables are now compatible with Observable.from ([#14](https://github.com/skunkteam/sherlock/issues/14)) ([de338b2](https://github.com/skunkteam/sherlock/commit/de338b26f0a10de3197f86d5e74be8fca3587fba))
-   **sherlock:** expose easier final and error state constructors ([#13](https://github.com/skunkteam/sherlock/issues/13)) ([032939f](https://github.com/skunkteam/sherlock/commit/032939fc0996436206cc91dbb46a9395b66b44d7))
-   **sherlock:** modernize types ([#4](https://github.com/skunkteam/sherlock/issues/4)) ([8455d77](https://github.com/skunkteam/sherlock/commit/8455d77aea9dc7e593614c2227554093278c8f64))
-   **sherlock:** support SettableDerivables in flatMap ([#10](https://github.com/skunkteam/sherlock/issues/10)) ([adc2c10](https://github.com/skunkteam/sherlock/commit/adc2c10f5872a62672cb0e60c7944be569d41e5d))
-   **sherlock-utils:** improved/simplified derivableCache API ([c164dd7](https://github.com/skunkteam/sherlock/commit/c164dd7e6dbd1c3413f9ec3f5a948176fc9c7da2))
-   **sherlock-utils:** modernize `struct` ([#5](https://github.com/skunkteam/sherlock/issues/5)) ([17070d8](https://github.com/skunkteam/sherlock/commit/17070d8a439c8be940d013023d18086facf89fc3))

### Bug Fixes

-   **sherlock:** correctly detect final unresolved state in connected derivations ([#15](https://github.com/skunkteam/sherlock/issues/15)) ([64be7d0](https://github.com/skunkteam/sherlock/commit/64be7d05854770b4a324a91f43680fdc3a5a9fe5))
-   **sherlock:** fix subtle typing-bugs because of newer TypeScript features ([#12](https://github.com/skunkteam/sherlock/issues/12)) ([d386c1f](https://github.com/skunkteam/sherlock/commit/d386c1fe8e09bc3d274f891bbd028be09e0d606f))
-   **sherlock-utils:** derivableCache incorrectly reuses cached results when mixing Derivables and non-Derivables as input ([#11](https://github.com/skunkteam/sherlock/issues/11)) ([ecf7da4](https://github.com/skunkteam/sherlock/commit/ecf7da41c82267d2b61f1c26c85751b9249ee62c))

## [5.0.0](https://github.com/skunkteam/sherlock/compare/v4.0.0...v5.0.0) (2021-01-25)

### ⚠ BREAKING CHANGES

-   **sherlock-rxjs:** This release changes the behavior of `fromObservable` when not connected. From now on, a Derivable created by `fromObservable` will become unresolved when disconnected. In previous versions the Derivable would remember the last received value which can lead to unexpected stale results when reconnecting or even memory leaks. To get the old behavior use `take`: `fromObservable(...).take({ when: d => d.resolved })` to always cache the latest value when disconnecting.

### Features

-   **ngx-sherlock:** add value pipe ([4bfc04b](https://github.com/skunkteam/sherlock/commit/4bfc04b09cc199f82863691621f69c130f3407e3))
-   **sherlock-utils:** add fromEventPattern ([dc082e2](https://github.com/skunkteam/sherlock/commit/dc082e236072f356adce5da994c72cb5ec342cd3))

### Bug Fixes

-   **sherlock-rxjs:** fix possible stale-cache / memory leak in fromObservable ([8093644](https://github.com/skunkteam/sherlock/commit/8093644220e6f7a12e8aff89ab9d4ad5f991a391))
-   **sherlock-rxjs:** remove use of @skunkteam/sherlock internals ([#2](https://github.com/skunkteam/sherlock/issues/2)) ([b5c5197](https://github.com/skunkteam/sherlock/commit/b5c5197ccb482047059ddba0aae171971e47781c))

## 4.0.0 (2021-01-21)

Initial migration from @politie/sherlock.

### ⚠ BREAKING CHANGES

-   sherlock-proxy is not longer supported and is not migrated to the new @skunkteam organization
