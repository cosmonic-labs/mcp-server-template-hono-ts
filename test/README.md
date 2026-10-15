# Tests

## Quickstart

To run tests:

```console
npm run test
```

Run HTTP client regression tests without building a Wasm component:

```console
npm run test:unit
```

To run all tests with debug logging enabled:

```console
NODE_DEBUG=test npm run test
```

To run a specific suite of tests (ex. the e2e server tests):

```console
npm run test e2e/server.ts
```
