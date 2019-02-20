# 💥 React effect manager

[![NPM Version][npm-image]][npm-url] ![NPM Downloads][downloads-image] [![GitHub issues][issues-image]][issues-url] [![Telegram][telegram-image]][telegram-url]

[npm-image]: https://img.shields.io/npm/v/cached-effect.svg
[npm-url]: https://www.npmjs.com/package/cached-effect
[downloads-image]: https://img.shields.io/npm/dw/cached-effect.svg
[issues-image]: https://img.shields.io/github/issues/doasync/cached-effect.svg
[issues-url]: https://github.com/doasync/cached-effect/issues
[telegram-image]: http://i.imgur.com/WANXk3d.png
[telegram-url]: https://t.me/doasync

Manage effects in React using hooks.
Create cached effects from async functions and handle them with `useCache` hook.
Run your effects in order to update cache.

> This package is very lightweight: 1.5kb minified (without `react`)

## Installation

```bash
npm install cached-effect
```

or `yarn`

```bash
yarn add cached-effect
```

## Usage

```js
import { createEffect, useCache } from 'cached-effect'
```

Wrap an async function or a function that returns a promise in `createEffect`:

```js
const myEffect = createEffect(async () => { /* do something */ })

// or

const fetchUsers = createEffect(({ organizationId }) => http
  .get(`/organizations/${organizationId}/users`)
  .then(getData)
  .then(getUsers))
```

Then wrap your effect in `useCache` hook in your React component:

```js
const [users, usersError, usersLoading] = useCache(fetchUsers)
```

It returns an array of `[result, error, pending]`, which is equal to
`[undefined, null, false]` by default. These values stay the same until you run
your effect. Use array destructuring to get values that you need.

### Running effects

In order to update the cache you need to run your effect.
You can do this, for example, in `useEffect` hook inside of your component.

```js
useEffect(() => {
  fetchUsers({ organizationId }) // or fetchUsers.once (see below)
}, [])
```

So, users will be fetched after the component is mounted.
But it's useful to run your effect only **once**, for instance,
when you have many components using this effect:

```js
useEffect(() => {
  fetchUsers.once({ organizationId })
}, [])
```

You can also refetch users (rerun any effect) manually just calling it:

```js
<Button
  type='button'
  onClick={() => fetchUsers({ organizationId })}
/>
```

## React Hooks

#### `useCache` hook

Takes an effect and returns an array of `[result, error, pending]`:

```js
const [result, error, pending] = useCache(effect)
```

It is equal to `[undefined, null, false]` by default and updates its values
when you call the effect

#### `usePending` hook

Returns a pending status of your effect (true/false):

```js
const pending = usePending(effect)
```

You can use it to show a spinner, for example.
It is a syntactic sugar over `useCache` hook (the third value)

#### `useError` hook

Returns an error of your effect (or `null`):

```js
const error = useError(effect)
```

You can use it if you need to show only an error of your effect somewhere.
It is a syntactic sugar over `useCache` hook (the second value)

## Effect

Effect is a container for an async function. It can be safely used in place of
the original async function.

#### `createEffect(handler)`

Creates and returns an effect

#### `effect(payload)`

Runs an effect. Returns promise

#### `effect.once(payload)`

Runs an effect only once. Returns original promise on a repeated call

#### `effect.watch(watcher)`

Listens to the effect and calls watcher. Watcher receives payload and promise.

Returns back an unsubscribe function.

#### `effect.use(handler)`

Injects an async function into effect (can be called multiple times).
This is useful for mocking API calls, testing etc.

#### `effect.use.getCurrent()`

Returns current effect handler

## Promise

Promise is a container for async value. It has some additional methods.

#### `promise.cache()`

Returns a result synchronously if promise is completed successfully. 

There will be no `promise.cache` method if promise is rejected!

#### `promise.failure()`

Returns an error synchronously if promise failed.

There will be no `promise.failure` method if promise fulfills!

#### `promise.anyway()`

Returns a promise that will be resolved anyway (aka `.finally`)

### Tip

If you found this hook useful, please star this package on [GitHub](https://github.com/doasync/cached-effect) ★

### Author

@doasync

### Credits

This package was inspired by [Effector](https://github.com/zerobias/effector) library (from @ZeroBias). Effector is a reactive state manager, which has stores, events and effects as well as other useful features for managing state. This package is not compatible with `effector` effects right now.
