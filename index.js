/* eslint-disable no-use-before-define, promise/catch-or-return */

const { useReducer, useRef } = require('react');

const promiseMap = new WeakMap();
const toggleState = state => !state;

function useCache (effect) {
  const mountingRef = useRef(true);
  const [, forceUpdate] = useReducer(toggleState, false);
  const thunk = effect.use.getCurrent();
  const fpromise = promiseMap.get(thunk);

  if (fpromise) {
    if (fpromise.cache) {
      const result = fpromise.cache();
      return [result, null, false];
    }
    if (fpromise.failure) {
      const error = fpromise.failure();
      return [undefined, error, false];
    }
    fpromise.anyway().then(forceUpdate);
    return [undefined, null, true];
  }

  if (mountingRef.current === true) {
    const effectCreate = effect.create;
    // eslint-disable-next-line no-param-reassign
    effect.create = (payload) => {
      const p = effectCreate(payload);
      p.anyway().then(forceUpdate);
      return p;
    };
    mountingRef.current = false;
  }

  return [undefined, null, false];
}

function useError (effect) {
  return useCache(effect)[1];
}

function usePending (effect) {
  return useCache(effect)[2];
}

function createEffect (handler) {
  const instance = (payload, ...args) => instance.create(payload, args);

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
  let success = false;
  let fpromise;

  try {
    promise = thunk(payload);
    success = true;
  } catch (err) {
    syncError = err;
  }

  if (success === false) {
    fpromise = Promise.reject(syncError);
    fpromise.failure = () => syncError;
    fpromise.anyway = () => Promise.resolve();
    return fpromise;
  }

  if (
    typeof promise === 'object'
    && promise !== null
    && typeof promise.then === 'function'
  ) {
    fpromise = promise.then(
      (result) => {
        fpromise.cache = () => result;
        return result;
      },
      (error) => {
        fpromise.failure = () => error;
        throw error;
      },
    );
    fpromise.anyway = () => fpromise.then(() => undefined, () => {});
    return fpromise;
  }

  fpromise = Promise.resolve(promise);
  fpromise.cache = () => promise; // result
  fpromise.anyway = () => Promise.resolve();
  return fpromise;
}

module.exports = {
  useCache,
  useError,
  usePending,
  createEffect,
};
