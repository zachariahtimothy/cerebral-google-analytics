/* eslint-env mocha */
import { Controller, Module } from 'cerebral';
import assert from 'assert';
import GoogleAnalyticsProvider, { GoogleAnalyticsProviderError } from './';

describe('Google Analytics Module', () => {
  it('should fire pageview signal', done => {
    const rootModule = Module({
      modules: {
        analytics: GoogleAnalyticsProvider({
          debug: true,
        }),
      },
      signals: {
        pageview: ({ props, analytics }) => {
          const { page } = props;
          analytics.pageview(page);
          done();
        },
      },
    })
    const controller = Controller(rootModule);

    controller.getSignal('pageview')({ page: 'foo' });
  });
});
