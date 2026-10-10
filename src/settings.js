export function createSettings(scope = globalThis) {
  const api = scope.browser ?? scope.chrome;
  if (!api?.storage?.local || !api.storage.onChanged) throw new Error('Storage unavailable');
  const promiseAPI = Boolean(scope.browser);
  function call(method, value) {
    if (promiseAPI) return api.storage.local[method](value);
    return new Promise((resolve, reject) => {
      api.storage.local[method](value, result => {
        const error = api.runtime?.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    });
  }
  return {
    async read() {
      const result = await call('get', 'enabled');
      return typeof result.enabled === 'boolean' ? result.enabled : true;
    },
    write(enabled) {
      if (typeof enabled !== 'boolean') throw new TypeError('Expected a boolean');
      return call('set', { enabled });
    },
    watch(listener) {
      const onChange = (changes, area) => {
        if (area === 'local' && Object.hasOwn(changes, 'enabled')) {
          listener(typeof changes.enabled.newValue === 'boolean' ? changes.enabled.newValue : true);
        }
      };
      api.storage.onChanged.addListener(onChange);
      return () => api.storage.onChanged.removeListener(onChange);
    }
  };
}
