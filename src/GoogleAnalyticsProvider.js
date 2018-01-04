import { Provider } from 'cerebral';
import loadGA from './utils/loadGA';
import { warn, log } from './utils/console';
import TestModeAPI from './utils/testModeAPI';
import format from './utils/format';
import trim from './utils/trim';
import removeLeadingSlash from './utils/removeLeadingSlash';
import GAProviderError from './GAProviderError';

let _debug = false;
let _titleCase = true;
let _testMode = false;

const internalGa = (...args) => {
  if (_testMode) return TestModeAPI.ga(...args);
  if (!window.ga) return warn('ReactGA.initialize must be called first or GoogleAnalytics should be loaded manually');
  return window.ga(...args);
};

function _format(s) {
  return format(s, _titleCase);
}

function _gaCommand(trackerNames, ...args) {
  const command = args[0];
  if (typeof internalGa === 'function') {
    if (typeof command !== 'string') {
      throw new GAProviderError('ga command must be a string');
    }

    internalGa(...args);
    if (Array.isArray(trackerNames)) {
      trackerNames.forEach((name) => {
        internalGa(...[`${name}.${command}`].concat(args.slice(1)));
      });
    }
  }
}

function initialize(gaTrackingID, options) {
  if (!gaTrackingID) {
    throw new GAProviderError('gaTrackingID is required in initialize()');
  }

  if (options) {
    if (options.debug && options.debug === true) {
      _debug = true;
    }

    if (options.titleCase === false) {
      _titleCase = false;
    }
  }

  if (options && options.gaOptions) {
    internalGa('create', gaTrackingID, options.gaOptions);
  } else {
    internalGa('create', gaTrackingID, 'auto');
  }
}

/**
 * ga:
 * Returns the original GA object.
 */
function ga(...args) {
  if (args.length > 0) {
    internalGa(...args);
    if (_debug) {
      log('called ga(\'arguments\');');
      log(`with arguments: ${JSON.stringify(args)}`);
    }
  }

  return window.ga;
}

/**
 * set:
 * GA tracker set method
 * @param {Object} fieldsObject - a field/value pair or a group of field/value pairs on the tracker
 * @param {Array} trackerNames - (optional) a list of extra trackers to run the command on
 */
function set(fieldsObject, trackerNames) {
  if (!fieldsObject) {
    throw new GAProviderError('`fieldsObject` is required in .set()');
  }

  if (typeof fieldsObject !== 'object') {
    throw new GAProviderError('Expected `fieldsObject` arg to be an Object');
  }

  if (Object.keys(fieldsObject).length === 0) {
    warn('empty `fieldsObject` given to .set()');
  }

  _gaCommand(trackerNames, 'set', fieldsObject);

  if (_debug) {
    log('called ga(\'set\', fieldsObject);');
    log(`with fieldsObject: ${JSON.stringify(fieldsObject)}`);
  }
}

/**
 * send:
 * Clone of the low level `ga.send` method
 * WARNING: No validations will be applied to this
 * @param  {Object} fieldObject - field object for tracking different analytics
 * @param  {Array} trackerNames - trackers to send the command to
 * @param {Array} trackerNames - (optional) a list of extra trackers to run the command on
 */
function send(fieldObject, trackerNames) {
  _gaCommand(trackerNames, 'send', fieldObject);
  if (_debug) {
    log('called ga(\'send\', fieldObject);');
    log(`with fieldObject: ${JSON.stringify(fieldObject)}`);
    log(`with trackers: ${JSON.stringify(trackerNames)}`);
  }
}

/**
 * pageview:
 * Basic GA pageview tracking
 * @param  {String} path - the current page page e.g. '/about'
 * @param {Array} trackerNames - (optional) a list of extra trackers to run the command on
 * @param {String} title - (optional) the page title e. g. 'My Website'
 */
function pageview(rawPath, trackerNames, title) {
  if (!rawPath) {
    throw new GAProviderError('path is required in .pageview()');
  }

  const path = trim(rawPath);
  if (path === '') {
    throw new GAProviderError('path cannot be an empty string in .pageview()');
  }

  const extraFields = {};
  if (title) {
    extraFields.title = title;
  }

  if (typeof ga === 'function') {
    _gaCommand(trackerNames, 'send', {
      hitType: 'pageview',
      page: path,
      ...extraFields
    });

    if (_debug) {
      log('called ga(\'send\', \'pageview\', path);');
      let extraLog = '';
      if (title) {
        extraLog = ` and title: ${title}`;
      }
      log(`with path: ${path}${extraLog}`);
    }
  }
}

/**
 * modalview:
 * a proxy to basic GA pageview tracking to consistently track
 * modal views that are an equivalent UX to a traditional pageview
 * @param  {String} modalName e.g. 'add-or-edit-club'
 * @param {Array} trackerNames - (optional) a list of extra trackers to run the command on
 */
function modalview(rawModalName, trackerNames) {
  if (!rawModalName) {
    throw new GAProviderError('modalName is required in .modalview(modalName)');
  }

  const modalName = removeLeadingSlash(trim(rawModalName));

  if (modalName === '') {
    throw new GAProviderError('modalName cannot be an empty string or a single / in .modalview()');
  }

  if (typeof ga === 'function') {
    const path = `/modal/${modalName}`;
    _gaCommand(trackerNames, 'send', 'pageview', path);

    if (_debug) {
      log('called ga(\'send\', \'pageview\', path);');
      log(`with path: ${path}`);
    }
  }
}

/**
 * timing:
 * GA timing
 * @param args.category {String} required
 * @param args.variable {String} required
 * @param args.value  {Int}  required
 * @param args.label  {String} required
 * @param {Array} trackerNames - (optional) a list of extra trackers to run the command on
 */
function timing({ category, variable, value, label } = {}, trackerNames) {
  if (typeof ga === 'function') {
    if (!category || !variable || !value || typeof value !== 'number') {
      throw new GAProviderError(`args.category, args.variable 
        AND args.value are required in timing() 
        AND args.value has to be a number`);
    }

    // Required Fields
    const fieldObject = {
      hitType: 'timing',
      timingCategory: _format(category),
      timingVar: _format(variable),
      timingValue: value
    };

    if (label) {
      fieldObject.timingLabel = _format(label);
    }

    send(fieldObject, trackerNames);
  }
}

/**
 * event:
 * GA event tracking
 * @param args.category {String} required
 * @param args.action {String} required
 * @param args.label {String} optional
 * @param args.value {Int} optional
 * @param args.nonInteraction {boolean} optional
 * @param {Array} trackerNames - (optional) a list of extra trackers to run the command on
 */
function event({
  category,
  action,
  label,
  value,
  nonInteraction,
  transport,
  ...args
} = {}, trackerNames) {
  if (typeof ga === 'function') {
    // Simple Validation
    if (!category || !action) {
      throw new GAProviderError('args.category AND args.action are required in event()');
    }

    // Required Fields
    const fieldObject = {
      hitType: 'event',
      eventCategory: _format(category),
      eventAction: _format(action)
    };

    // Optional Fields
    if (label) {
      fieldObject.eventLabel = _format(label);
    }

    if (typeof value !== 'undefined') {
      if (typeof value !== 'number') {
        warn('Expected `args.value` arg to be a Number.');
      } else {
        fieldObject.eventValue = value;
      }
    }

    if (typeof nonInteraction !== 'undefined') {
      if (typeof nonInteraction !== 'boolean') {
        warn('`args.nonInteraction` must be a boolean.');
      } else {
        fieldObject.nonInteraction = nonInteraction;
      }
    }

    if (typeof transport !== 'undefined') {
      if (typeof transport !== 'string') {
        warn('`args.transport` must be a string.');
      } else {
        if (['beacon', 'xhr', 'image'].indexOf(transport) === -1) {
          warn('`args.transport` must be either one of these values: `beacon`, `xhr` or `image`');
        }

        fieldObject.transport = transport;
      }
    }

    Object.keys(args)
      .filter(key => key.substr(0, 'dimension'.length) === 'dimension')
      .forEach((key) => {
        fieldObject[key] = args[key];
      });

    Object.keys(args)
      .filter(key => key.substr(0, 'metric'.length) === 'metric')
      .forEach((key) => {
        fieldObject[key] = args[key];
      });

    // Send to GA
    send(fieldObject, trackerNames);
  }
}

/**
 * exception:
 * GA exception tracking
 * @param args.description {String} optional
 * @param args.fatal {boolean} optional
 * @param {Array} trackerNames - (optional) a list of extra trackers to run the command on
 */
function exception({ description, fatal }, trackerNames) {
  if (typeof ga === 'function') {
    // Required Fields
    const fieldObject = {
      hitType: 'exception'
    };

    // Optional Fields
    if (description) {
      fieldObject.exDescription = _format(description);
    }

    if (typeof fatal !== 'undefined') {
      if (typeof fatal !== 'boolean') {
        warn('`args.fatal` must be a boolean.');
      } else {
        fieldObject.exFatal = fatal;
      }
    }

    // Send to GA
    send(fieldObject, trackerNames);
  }
}

export default function GoogleAnalyticsProviderFactory(configsOrTrackingId, options) {
  if (options && options.testMode === true) {
    _testMode = true;
  } else {
    if (!process.browser) {
      // return false;
      return Provider({
        set() {},
        send() {},
        pageview() {},
        modalview() {},
        timing() {},
        event() {},
        exception() {},
      });
    }

    loadGA(options);
  }

  if (Array.isArray(configsOrTrackingId)) {
    configsOrTrackingId.forEach((config) => {
      if (typeof config !== 'object') {
        throw new GAProviderError('All configs must be an object');
      }
      initialize(config.trackingId, config);
    });
  } else {
    initialize(configsOrTrackingId, options);
  }
  return Provider({
    set,
    send,
    pageview,
    modalview,
    timing,
    event,
    exception,
  });
}
