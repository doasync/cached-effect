/* eslint-disable promise/always-return, promise/catch-or-return */

const { useRef, useReducer, useEffect } = require('react');

const promiseMap = new WeakMap();

const ERROR = 1;
const PENDING = 2;

const getStatus = (fpromise) => {
  if (fpromise.cache) {
    return [fpromise.cache(), null, false];
  }
  if (fpromise.failure) {
    return [undefined, fpromise.failure(), false];
  }
  return [undefined, null, true];
};

const toggleState = state => !state;

const useCache = (effect) => {
  const self = useRef({
    state: [undefined, null, false],
    promise: null,
  }).current;

  const [, forceUpdate] = useReducer(toggleState, true);
  const thunk = effect.use.getCurrent();
  const fpromise = promiseMap.get(thunk);

  if (fpromise) {
    self.state = getStatus(fpromise);
    self.promise = fpromise;
  }

  useEffect(() => {
    if (self.state[PENDING]) {
      fpromise.anyway().then(() => {
        if (self.promise === fpromise && self.state[PENDING]) {
          forceUpdate();
        }
      });
    }

    return effect.watch((payload, p) => {
      self.promise = p;
      if (!self.state[PENDING]) {
        forceUpdate();
      }

      return p.anyway().then(() => {
        if (self.promise === p && self.state[PENDING]) {
          forceUpdate();
        }
      });
    });
  }, []);

  return self.state;
};

const useError = (...args) => useCache(...args)[ERROR];
const usePending = (...args) => useCache(...args)[PENDING];

const exec = (thunk, payload) => {
  let promise;
  let fpromise;

  try {
    promise = thunk(payload);
  } catch (syncError) {
    fpromise = Promise.reject(syncError);
    fpromise.failure = () => syncError;
    fpromise.anyway = () => Promise.resolve();
    return fpromise;
  }

  if (typeof promise === 'object' && promise !== null && typeof promise.then === 'function') {
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
};

const createEffect = (handler) => {
  const watchers = new Set();
  let thunk = handler;

  const instance = (payload, ...args) => instance.create(payload, args);

  instance.use = (fn) => {
    thunk = fn;
    promiseMap.delete(thunk);
    return instance;
  };

  instance.use.getCurrent = () => thunk;

  instance.once = payload => promiseMap.get(thunk) || instance.create(payload);

  instance.create = (payload) => {
    if (thunk === undefined) throw new Error('no thunk used in effect');
    const fpromise = exec(thunk, payload);
    promiseMap.set(thunk, fpromise);
    watchers.forEach(watcher => watcher(payload, fpromise));
    return fpromise;
  };

  instance.watch = (watcher) => {
    watchers.add(watcher);
    return () => watchers.delete(watcher);
  };

  return instance;
};

module.exports = {
  useCache,
  useError,
  usePending,
  createEffect,
};
