
import { Module } from 'cerebral';
import GAProvider from './GoogleAnalyticsProvider';

export { default as GoogleAnalyticsProviderError } from './GoogleAnalyticsProviderError';

export default (gaTrackingId, options = {}) => {
  if (!gaTrackingId) {
    return Module(({ name }) => ({
      providers: {
        [name]: GAProvider()
      }
    }));
  }

  const doesMatchPath = statePathParts => (path, i) =>
        statePathParts[i] && (statePathParts[i] === '%' || signalPathParts[i] === path);

  return Module(({ name, controller }) => {
    controller.once('initialized:model', () => {
      // If we have a userid path, update from state
      if (options.gaOptions && options.gaOptions.userId) {
        const userIdParts = options.gaOptions.userId.split('.');
        setTimeout(() => {
          const userId = controller.model.get(userIdParts);
          options.gaOptions.userId = userId;
        }, 2);
      }
    });
    const providers = {
      [name]: GAProvider(gaTrackingId, options)
    };
    const signals = {
      setEvent: context => {
        const { props } = context;
        const provider = context[name];
        provider.event(props);
      }
    };

    if (options.events) {
      controller.on('flush', changes => {
        changes.forEach(change => {
          Object.keys(options.events).forEach(eventName => {
            const eventConfig = options.events[eventName];
            const { statePath } = eventConfig.signal;
            const statePathParts = statePath.split('.');
            const matches = change.path.length === statePathParts.length &&
              change.path.every(doesMatchPath(statePathParts));
            if (matches) {
              const value = controller.getState(change.path.join('.'));
              if (value) {
                const signal = controller.getSignal(`${name}.setEvent`);
                const { action, category, label, ...otherEventConfigs } = eventConfig;
                const payload = {
                  action: action || 'stateChange',
                  category: category || eventName,
                  label: label || value,
                  ...otherEventConfigs
                };
                signal(payload);
              }
            }
          });
        });
      });
    }
    return {
      signals,
      providers,
    };
  });
};
