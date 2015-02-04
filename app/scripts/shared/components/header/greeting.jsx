"use strict";

var _ = require('lodash');
var ReactIntl = require('react-intl');
var IntlMixin = ReactIntl.IntlMixin;
var FormattedMessage = ReactIntl.FormattedMessage;
var React = require('react');
var Link = require('react-router').Link;

var Greeting = React.createClass({

  mixins: [IntlMixin],

  propTypes: {
    greetingClassName: React.PropTypes.string,
    isLoggedIn: React.PropTypes.bool,
    userName: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      greetingClassName: 'greeting-wrapper',
      isLoggedIn: false,
      userName: ''
    };
  },

  handleLoggedIn: function() {
    return (
      <div className="greeting" />
    );
  },

  handleLoggedOut: function() {
    return false;
  },

  displayGreeting: function(loginState) {
    var loginStateMap = {
      true: this.handleLoggedIn,
      false: this.handleLoggedOut
    };

    if (!_.isUndefined(loginStateMap[loginState])) {
      return loginStateMap[loginState]();
    } else {
      return false;
    }
  },

  render: function() {
    return (
      <div className={this.props.greetingClassName}>
        {this.displayGreeting(this.props.isLoggedIn)}
      </div>
    );
  }
});

module.exports = Greeting;
