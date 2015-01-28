"use strict";

var _ = require('lodash');

var React = require('react');

var Router = require('react-router');
var Navigation = Router.Navigation;

var session = require('../models/session');
var sessionActions = require('../actions');
var LoginForm = require('./login-form.jsx');

var Session = React.createClass({
  mixins: [Router.State, Navigation],

  propTypes: {
    loginPath: React.PropTypes.string,
    logoutPath: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      loginPath: '/',
      logoutPath: '/'
    };
  },

  toLogin: function() {
    return <LoginForm />;
  },

  toLogout: function() {
    sessionActions.logout();
  },

  switchState: function(path) {
    var loginStateMap = {};

    loginStateMap[this.props.loginPath] = this.toLogin;
    loginStateMap[this.props.logoutPath] = this.toLogout;

    if (!_.isUndefined(loginStateMap[path])) {
      return loginStateMap[path]();
    } else {
      return false;
    }
  },

  render: function() {
    return (
      <div>
        {this.switchState(this.getPath())}
      </div>
    );
  }
});

module.exports = Session;
