"use strict";

var stringLib = require('../i18n/messages');

if (!window.Intl) {
  window.Intl = require('intl');
}

var React = require('react');
var Router = require('react-router');
var routes = require('./components/router.jsx');

Router.run(routes, function(Handler) {
  React.render(<Handler {...stringLib} locales={['en-US']} />, document.getElementById('content-main'));
});

