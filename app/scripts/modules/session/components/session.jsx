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
    loginRoute: React.PropTypes.string,
    logoutRoute: React.PropTypes.string,
    defaultRoute: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      loginRoute: '/',
      logoutRoute: '/',
      defaultRoute: '/'
    };
  },

  redirectToLogin: function() {
    this.transitionTo(this.props.loginRoute);
  },

  toLogin: function() {
    return <LoginForm defaultRoute={this.props.defaultRoute} />;
  },

  toLogout: function() {
    sessionActions.logout();
  },

  switchState: function(path) {
    var loginStateMap = {};

    loginStateMap[this.props.loginRoute] = this.toLogin;
    loginStateMap[this.props.logoutRoute] = this.toLogout;

    if (!_.isUndefined(loginStateMap[path])) {
      return loginStateMap[path]();
    } else {
      return false;
    }
  },

  componentWillMount: function() {
    session.on('logout', this.redirectToLogin, this);
  },

  componentWillUnmount: function() {
    session.off('logout');
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
