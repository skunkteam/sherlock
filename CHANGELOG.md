# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
