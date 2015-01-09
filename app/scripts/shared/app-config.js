/*
  example config: {
    baseName: 'admin@example.com',
    baseUrl: 'https://localhost:5000'
  }
*/

var config = {
  baseName: '', // populated in username input of login form
  baseUrl: '', // populated in host url input of login form
  pollingRate: 5000, // millisecond intervals between polls for status checking/retrying failed payments
  maxPollCount: Infinity // number of times to attempt polling until payment status is cleared/failed
};

module.exports = config;
