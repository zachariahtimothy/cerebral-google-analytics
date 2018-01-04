# cerebral-google-analytics

## Description
Google analytics module and provider for Cerebral JS
This module exposes Google Analytics as a provider,
Heavily inspired by and code utilized from [React-GA](https://github.com/react-ga/react-ga).
Has the ability to auto-fire events based on signal change.

## Install
**NPM**

`npm install cerebral-google-analytics`

## Instantiate

```js
import { Module, Controller } from 'cerebral'
import GAModule from 'cerebral-google-analytics'

const analytics = GAModule({
  // (optional) Enable debug mode
  debug: true,
  // (optional) Change to title case
  titleCase: false,
  // (optional) Additional GA options
  gaOptions: {
    // (optional) Location in state to user ID
    userId: 'myModule.path.to.userId'
  },
  // Events to fire
  signalEvents: {
    someValueChanged: {
      // (requied) Signal path to fire event from. Use % for fuzzy matching.
      // This is useful when you have lots of sub-modules where the parent handles signals.
      signal: 'myModule.%.%.form.myField.value',
      // (optional, defaults to 'stateChange') Action to send to GA
      // Ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#eventAction
      action: 'Some action',
      // (optional, defaults to key (someValueChanged)) Category to pass to GA
      category: 'Some category',
      // (optional, defaults to the value that was changed) Label to pass to GA
      // Ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#eventLabel
      label: 'Some label',
      // (optional) Number
      // Ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#eventValue
      value: 123,
    },
  }
})

const app = Module({
  modules: { analytics }
})

const controller = Controller(app)
```

## error

### StorageProviderError

```js
import { GoogleAnalyticsProviderError } from 'cerebral-google-analytics'

// Error structure
{
  name: 'GoogleAnalyticsProviderError',
  message: 'Some ga error'
  stack: '...'  
}
```

## pageview
Send a page view to GA

*action*
```javascript
function someAction({ analytics }) {
  analytics.pageview('some URL') // Could pull from state / router provider
}
```
## modalview

## event
Send an event GA

*action*
```javascript
function someAction({ analytics }) {
  analytics.event({
    action: 'Play',
    category: 'Video',
  })
}
```

## set

## send

## timing

## exception

## Credits
Google analytic functionality borrowed from the great [React-GA](https://github.com/react-ga/react-ga) library.
Module/Provider functionality inspired by [@cerebral's](https://github.com/cerebral/cerebral/tree/next/packages/node_modules/%40cerebral) modules.