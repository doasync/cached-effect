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
    updated: false,
  }).current;

  const [, forceUpdate] = useReducer(toggleState, true);
  const thunk = effect.use.getCurrent();
  const fpromise = promiseMap.get(thunk);

  self.updated = true;

  useEffect(() => effect.watch((payload, p) => {
    self.updated = false;
    // eslint-disable-next-line promise/catch-or-return
    p.anyway().then(() => !self.updated && forceUpdate());
  }), []);

  if (!fpromise) {
    return self.state;
  }

  self.state = getStatus(fpromise);

  if (fpromise !== self.promise) {
    if (self.state[PENDING]) {
      // eslint-disable-next-line promise/catch-or-return
      fpromise.anyway().then(() => self.state[PENDING] && forceUpdate());
    }
    self.promise = fpromise;
  }

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
};

const createEffect = (handler) => {
  const watchers = new Set();
  let thunk;

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

  thunk = handler;

  return instance;
};

module.exports = {
  useCache,
  useError,
  usePending,
  createEffect,
};
