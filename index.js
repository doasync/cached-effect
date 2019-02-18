/* eslint-disable no-use-before-define, promise/catch-or-return */

const { useState } = require('react');

const CACHE = {
  result: 0,
  error: 1,
};

const promiseMap = new WeakMap();

function useCache (effect, kind) {
  const [state, setState] = useState([undefined, null]);
  const thunk = effect.use.getCurrent();
  const fpromise = promiseMap.get(thunk);

  if (fpromise) {
    if (fpromise.cache) {
      return kind !== undefined
        ? fpromise.cache()[kind]
        : fpromise.cache();
    }
    fpromise
      .then(result => setState([result, null]))
      .catch(error => setState([undefined, error]));
  } else {
    const effectCreate = effect.create;
    // eslint-disable-next-line no-param-reassign
    effect.create = payload => effectCreate(payload)
      .then(result => setState([result, null]))
      .catch(error => setState([undefined, error]));
  }

  return kind !== undefined ? state[kind] : state;
}

function useError (effect) {
  return useCache(effect, CACHE.error);
}

function usePending (effect) {
  const thunk = effect.use.getCurrent();
  const fpromise = promiseMap.get(thunk);

  if (!thunk || !fpromise) {
    return false;
  }

  return !fpromise.cache;
}

function createEffect (handler) {
  const instance = payload => instance.create(payload);

  instance.once = payload => promiseMap.get(thunk) || instance.create(payload);

  instance.use = (fn) => {
    instance.use.called = false;
    thunk = fn;
    return instance;
  };

  instance.use.getCurrent = () => thunk;
  instance.use.called = false;

  instance.create = (payload) => {
    if (thunk === undefined) {
      throw new Error('no thunk used in effect');
    }
    const fpromise = exec(payload, thunk);
    instance.use.called = true;
    promiseMap.set(thunk, fpromise);
    return fpromise;
  };

  let thunk = handler;

  return instance;
}

function exec (args, thunk) {
  let promise;
  let errorSync;
  let done = false;
  let fpromise;

  try {
    promise = thunk(args);
    done = true;
  } catch (err) {
    errorSync = err;
  }

  if (done === false) {
    fpromise = Promise.reject(errorSync);
    fpromise.cache = () => [undefined, errorSync];

    return fpromise;
  }

  if (
    typeof promise === 'object'
    && promise !== null
    && typeof promise.then === 'function'
  ) {
    fpromise = promise.then(
      (result) => {
        fpromise.cache = () => [result, null];
        return result;
      },
      (error) => {
        fpromise.cache = () => [undefined, error];
        throw error;
      },
    );

    return fpromise;
  }

  fpromise = Promise.resolve(promise);
  fpromise.cache = () => [promise, null];

  return fpromise;
}

module.exports = {
  CACHE,
  useCache,
  useError,
  usePending,
  createEffect,
};
