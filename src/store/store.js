const { clone } = require('../utils/helpers');

function createStore(initialState = {}) {
  let state = clone(initialState);
  const listeners = new Set();

  function notify() {
	for (const listener of listeners) {
	  try {
		listener(state);
	  } catch (err) {
		// Un suscriptor defectuoso no debe romper la tienda.
	  }
	}
  }

  return {
	getState: () => state,
	setState(nextState) {
	  state = typeof nextState === 'function' ? nextState(state) : clone(nextState);
	  notify();
	  return state;
	},
	patchState(partialState = {}) {
	  state = { ...state, ...clone(partialState) };
	  notify();
	  return state;
	},
	reset(nextState = initialState) {
	  state = clone(nextState);
	  notify();
	  return state;
	},
	subscribe(listener) {
	  if (typeof listener !== 'function') return () => {};
	  listeners.add(listener);
	  return () => listeners.delete(listener);
	},
	clear() {
	  listeners.clear();
	},
  };
}

const appStore = createStore();

module.exports = {
  createStore,
  appStore,
  store: appStore,
};

