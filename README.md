# 💥 React effect manager

[![NPM Version][npm-image]][npm-url] ![NPM Downloads][downloads-image] [![GitHub issues][issues-image]][issues-url] [![Telegram][telegram-image]][telegram-url]

[npm-image]: https://img.shields.io/npm/v/cached-effect.svg
[npm-url]: https://www.npmjs.com/package/cached-effect
[downloads-image]: https://img.shields.io/npm/dw/cached-effect.svg
[issues-image]: https://img.shields.io/github/issues/doasync/cached-effect.svg
[issues-url]: https://github.com/doasync/cached-effect/issues
[telegram-image]: http://i.imgur.com/WANXk3d.png
[telegram-url]: https://t.me/doasync

Manage effects in React using hooks. Create cached effects from async functions and handle them with `useCache` hook. Call your effects to update cache

## Installation

```bash
npm install cached-effect
```

or

```bash
yarn add cached-effect
```

## Usage

```js
import { createEffect, useCache } from 'cached-effect'
```

#### `createEffect` function

Wrap an async function (that returns a promise) in `createEffect`:

```js
const myEffect = createEffect(async () => { /* do something */ })
// or
const fetchUsers = createEffect(({ organizationId }) => http
  .get(`/organizations/${organizationId}/users`)
  .then(getData)
  .then(getUsers))
```

#### `useCache` hook

Then wrap your effect in `useCache` hook in your React component:

```js
const [users, usersError, usersLoading] = useCache(fetchUsers)
```

`useCache` returns an array of `[result, error, pending]` which is
equal to `[undefined, null, false]` by default.

#### Running effects

In order to populate the cache you need to run your effect.
You can do it, for example, in `useEffect` hook inside of your component:

```js
useEffect(() => {
  fetchUsers({ organizationId }) // or fetchUsers.once (see below)
}, [])
```

In the above example, users will be fetched after the component is mounted.

You can also refetch users (trigger any effect) manually just calling it:

```js
<Button
  type='button'
  onClick={() => fetchUsers({ organizationId })}
/>
```

#### `.once(payload)` method

You can run your effect only once, for instance,
when you have many components using this effect:

```js
useEffect(() => {
  fetchUsers.once({ organizationId })
}, [])
```

#### `usePending` hook

To show a spinner, for example, you can use `usePending` hook
to get current pending status (true/false):

```js
const usersLoading = usePending(fetchUsers)
```

#### `useError` hook

If you need to show only an error somewhere for this effect, use `useError` hook
to get current error (or `null` if your effect is done successfully):

```js
const usersError = useError(fetchUsers)
```

#### `.use(handler)` method

You can replace an async handler of your effect by using `.use` method.
This is useful for mocking API calls, testing etc.
Just pass a new handler to `.use` method:

```js
fetchUsers.use(async () => {})
```

### Tip

If you found this hook useful, please star this package on [GitHub](https://github.com/doasync/cached-effect) ★

### Author

@doasync

### Credits

This package was inspired by [Effector](https://github.com/zerobias/effector) library (from @ZeroBias). Effector is a reactive state manager, which has stores, events and effects as well as other useful features for managing state. It's also has `effector-react` package for React. This `cached-effect` package is currently not compatible with `effector` effects
