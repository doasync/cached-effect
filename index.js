/* eslint-disable no-use-before-define, promise/catch-or-return */

const { useState } = require('react');

const promiseMap = new WeakMap();
const defaultCache = [undefined, null]

function useCache (effect) {
  const [state, setState] = useState(defaultCache);
  const thunk = effect.use.getCurrent();
  const fpromise = promiseMap.get(thunk);

  if (fpromise) {
    if (fpromise.cache) {
      return fpromise.cache();
    }
    fpromise.then(
      result => setState([result, null]),
      error => setState([undefined, error]),
    );
  } else {
    const effectCreate = effect.create;
    // eslint-disable-next-line no-param-reassign
    effect.create = (payload) => {
      const fp = effectCreate(payload);
      fp.then(
        result => setState([result, null]),
        error => setState([undefined, error]),
      );
      return fp;
    };
  }

  return state;
}

function useError (effect) {
  return useCache(effect)[1];
}

function usePending (effect) {
  const [pending, setPending] = useState(true);
  const thunk = effect.use.getCurrent();
  const fpromise = promiseMap.get(thunk);

  if (fpromise) {
    if (fpromise.cache) {
      return false;
    }
    fpromise.then(
      () => setPending(false),
      () => setPending(false),
    );
    return pending;
  }

  return false;
}

function createEffect (handler) {
  const instance = payload => instance.create(payload);

  instance.use = (fn) => {
    thunk = fn;
    return instance;
  };
  instance.use.getCurrent = () => thunk;

  instance.once = payload => promiseMap.get(thunk) || instance.create(payload);

  instance.create = (payload) => {
    if (thunk === undefined) {
      throw new Error('no thunk used in effect');
    }
    const fpromise = exec(thunk, payload);
    promiseMap.set(thunk, fpromise);
    return fpromise;
  };

  let thunk = handler;

  return instance;
}

function exec (thunk, payload) {
  let promise;
  let syncError;
  let done = false;
  let fpromise;

  try {
    promise = thunk(payload);
    done = true;
  } catch (err) {
    syncError = err;
  }

  if (done === false) {
    fpromise = Promise.reject(syncError);
    fpromise.cache = () => [undefined, syncError];
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
  useCache,
  useError,
  usePending,
  createEffect,
};
