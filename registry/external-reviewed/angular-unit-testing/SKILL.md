---
name: angular-unit-testing
description: Best practices for Angular unit testing with Jest in the blueprint frontend. Use this when writing or reviewing Angular/TypeScript spec files.
---

# Angular Unit Testing

## Setup

- Use **Jest** as the test runner (`npm test`, `npm run test:ci`).
- Angular integration is provided by `jest-preset-angular`; the setup file is `src/testing/setup.ts`.
- Jest globals (`describe`, `it`, `expect`, `jest`, `beforeEach`, etc.) are available without imports — do **not** import them; they are injected automatically.

## File conventions

- Test files live next to the file under test: `foo.service.spec.ts` alongside `foo.service.ts`.
- One spec file per source file.
- Test match pattern: `src/app/**/*.spec.ts`.

## Test structure

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';
import { SomeDependency } from './some.dependency';

const buildMocks = () => ({
    someDependency: { getData: jest.fn().mockReturnValue(of('result')) } as unknown as SomeDependency
});

let service: MyService;
let mocks: ReturnType<typeof buildMocks>;

beforeEach(() => {
    mocks = buildMocks();
    TestBed.configureTestingModule({
        providers: [
            MyService,
            { provide: SomeDependency, useValue: mocks.someDependency }
        ]
    });
    service = TestBed.inject(MyService);
});

describe('MyService', () => {
    describe('myMethod', () => {
        it('should return expected result', () => { /* ... */ });
    });
});
```

- Always call `TestBed.configureTestingModule` in `beforeEach` — Angular resets `TestBed` between tests automatically.
- Build mocks with `buildMocks()` factory in `beforeEach` — never share mutable mock state across tests.

## Mocking modules and classes

Use `jest.mock(...)` at the top of the file, then override behaviour in `beforeEach`:

```typescript
jest.mock('./auth.service');
jest.mock('../services/current-user.service');

const loginMock = jest.fn().mockReturnValue(Promise.resolve());

const mockServicesWith = (user: UserProfile | null) => {
    mockClass(AuthService, () => Object({
        isAuthenticated: () => user !== undefined,
        loginRedirect: loginMock
    }));
};

beforeEach(() => {
    loginMock.mockClear();
    TestBed.configureTestingModule({ providers: [AuthService] });
});
```

Use the `mockClass` helper from `@test/mocks/class-mocker` to configure mock constructors:

```typescript
import { mockClass } from '@test/mocks/class-mocker';

mockClass(CurrentUserService, () => Object({ currentUser: () => user }));
```

## HTTP interceptor testing

For interceptor tests, use `AngularTesterBuilder` from `@test/builders/angular-tester-builder`:

```typescript
import { AngularTester, AngularTesterBuilder } from '@test/builders/angular-tester-builder';

let tester: AngularTester;

beforeEach(async() => {
    tester = await new AngularTesterBuilder()
        .withProviders([
            provideHttpClient(withInterceptors([myInterceptor])),
            provideHttpClientTesting(),
            { provide: MyService, useFactory: mockMyService }
        ])
        .build();
});

it('should add header to API requests', (done: jest.DoneCallback) => {
    tester.requestSuccess(done, (result: TestRequest) => {
        expect(result.request.headers.get('X-Custom')).toEqual('value');
    });
});
```

## Parameterized tests — describe.each / it.each

**Always scan for duplication before writing a new `it()`.** If multiple tests share the same body and differ only in input values, collapse them with `describe.each` or `it.each`:

```typescript
// ❌ avoid — identical structure, only data differs
it('should forbid null user', () => { ... });
it('should forbid user without permission', () => { ... });
it('should allow user with permission', () => { ... });

// ✅ correct — one parameterized block
describe.each([
    { description: 'should forbid null user', user: null, allowed: false },
    { description: 'should forbid user without permission', user: userWithoutPerm, allowed: false },
    { description: 'should allow user with permission', user: userWithPerm, allowed: true }
])('PermissionService', ({ description, user, allowed }) => {
    it(description, () => {
        const service = arrangeWith(user);
        expect(service.hasPermissions([PermissionId.ProductsWrite])).toBe(allowed);
    });
});
```

## Async tests

- Always `await` async service calls; never use `void` or fire-and-forget in tests.
- Use `(done: jest.DoneCallback)` for callback-style async (e.g. HTTP mock assertions):

```typescript
it('should resolve with data', async() => {
    await expect(service.loadData()).resolves.toEqual({ id: 1 });
});
```

## Pure function testing (no Angular)

For utilities and pure functions, skip `TestBed` entirely:

```typescript
import { myUtil } from './my-util';

describe('myUtil', () => {
    it('should transform input correctly', () => {
        const result = myUtil('input');
        expect(result).toBe('expected');
    });
});
```

## Coverage

- Run `npm run test:ci` to generate coverage.
- Coverage is collected from `src/app/core/**`, `src/app/shared/models/**`, `src/app/shared/pipes/**`, `src/app/shared/services/**`, `src/app/shared/validators/**`.
- Aim to cover all public methods and the primary happy/error paths.
- Do not write coverage-padding tests that add no semantic value.

## What NOT to do

- Do not import `describe`, `it`, `expect`, or `jest` from any module — they are global.
- Do not use Jasmine, Karma, or Vitest — the project uses Jest with `jest-preset-angular`.
- Do not use `.subscribe()` in tests — use `firstValueFrom()` or pass `of(value)` directly.
- Do not share mutable mock state across tests — recreate mocks in `beforeEach`.
- Do not snapshot-test Angular services — snapshots are for component templates and complex output.
- Do not leave `console.error` unchecked; if a code path logs an error, assert `jest.spyOn(console, 'error')` was called.

