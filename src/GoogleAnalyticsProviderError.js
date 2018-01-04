export default class GoogleAnalyticsProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GoogleAnalyticsProviderError';
    this.message = message;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
    };
  }
}
