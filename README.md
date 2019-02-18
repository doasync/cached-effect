# Cached effects in React + hooks

[![NPM Version][npm-image]][npm-url] ![NPM Downloads][downloads-image] [![GitHub issues][issues-image]][issues-url] [![Telegram][telegram-image]][telegram-url]

[npm-image]: https://img.shields.io/npm/v/cached-effect.svg
[npm-url]: https://www.npmjs.com/package/cached-effect
[downloads-image]: https://img.shields.io/npm/dw/cached-effect.svg
[issues-image]: https://img.shields.io/github/issues/doasync/cached-effect.svg
[issues-url]: https://github.com/doasync/cached-effect/issues
[telegram-image]: http://i.imgur.com/WANXk3d.png
[telegram-url]: https://t.me/doasync

Manage effects in React using async functions and hooks

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
import { createEffect, useCache } from './cached-effect'
```

#### `createEffect` function

Wrap an async function (that returns promise) in `createEffect`:

```js
export const fetchUsers = createEffect(({ organizationId }) => http
  .get(`/organizations/${organizationId}/users`)
  .then(getData)
  .then(getUsers))
```

#### `useCache` hook

Then wrap your effect in `useCache` hook in your React component:

```js
const [users, usersError] = useCache(fetchUsers)
```

`useCache` returns an array of `[result, error]` which is
equal to `[undefined, null]` by default.

#### Running effects

In order to populate the cache you need to run your effect in your component:

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

#### `.once()` method

You can run your effect only once, for example,
if you have many components using this effect:

```js
useEffect(() => {
  fetchUsers.once({ organizationId })
}, [])
```


#### `usePending` hook

If you need to show a spinner for example, you can use `usePending` hook
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

### Tip

If you found this hook useful, please star this package on [GitHub](https://github.com/doasync/cached-effect) ★

### Author
@doasync
