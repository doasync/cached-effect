const { useReducer, useRef } = require('react');

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
    mounting: true,
    promise: null,
    updated: false,
  }).current;

  const [, forceUpdate] = useReducer(toggleState, true);
  const thunk = effect.use.getCurrent();
  const fpromise = promiseMap.get(thunk);

  self.updated = true;

  if (self.mounting) {
    const effectCreate = effect.create;
    // eslint-disable-next-line no-param-reassign
    effect.create = (payload) => {
      const p = effectCreate(payload);
      self.updated = false;
      // eslint-disable-next-line promise/catch-or-return
      p.anyway().then(() => !self.updated && forceUpdate());
      return p;
    };
    self.mounting = false;
  }

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
    if (thunk === undefined) {
      throw new Error('no thunk used in effect');
    }
    const fpromise = exec(thunk, payload);
    promiseMap.set(thunk, fpromise);
    return fpromise;
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
