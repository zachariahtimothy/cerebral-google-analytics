/* eslint-env mocha */
import { Controller, Module } from 'cerebral';
import assert from 'assert';
import GoogleAnalyticsProvider, { GoogleAnalyticsProviderError } from './';

describe('Google Analytics Provider', () => {
  it('can create a provider', done => {
    const provider = GoogleAnalyticsProvider({
      debug: true,
    });
    assert.ok(typeof provider.moduleDescription === 'function', 'provider.moduleDescription is not a function');
    done();
  });
});
