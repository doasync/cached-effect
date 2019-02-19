/* eslint-disable no-use-before-define, promise/catch-or-return */

const { useReducer, useRef } = require('react');

const promiseMap = new WeakMap();
const toggleState = state => !state;

function useCache (effect) {
  const self = useRef({
    state: [undefined, null, false],
    mounting: true,
    promise: null,
    updated: false,
  }).current;

  const [, forceUpdate] = useReducer(toggleState, true);
  const thunk = effect.use.getCurrent();
  const fpromise = promiseMap.get(thunk);
  self.updated = true;

  if (self.mounting) {
    if (!fpromise) {
      const effectCreate = effect.create;
      // eslint-disable-next-line no-param-reassign
      effect.create = (payload) => {
        const p = effectCreate(payload);
        self.updated = false;
        p.anyway().then(() => !self.updated && forceUpdate());
        return p;
      };
    }
    self.mounting = false;
  }

  if (fpromise) {
    if (fpromise.cache) {
      const result = fpromise.cache();
      self.state = [result, null, false];
    }
    if (fpromise.failure) {
      const error = fpromise.failure();
      self.state = [undefined, error, false];
    }
    if (fpromise !== self.promise && !fpromise.cache && !fpromise.failure) {
      self.state = [undefined, null, true];
      fpromise.anyway().then(() => self.state[2] && forceUpdate());
    }
    self.promise = fpromise;
  }

  return self.state;
}

function useError (...args) {
  return useCache(...args)[1];
}

function usePending (...args) {
  return useCache(...args)[2];
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
