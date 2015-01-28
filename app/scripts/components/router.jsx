"use strict";

var React = require('react');

// needed for dev tools to work
window.React = React;

// React Router
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;
var Redirect = Router.Redirect;
var NotFound = require('./not-found/not-found.jsx');
var Navigation = require('react-router').Navigation;

var sessionModel = require('../modules/session/models/session');
var SessionComponent = require('../modules/session/components/session.jsx');
var isLoggedIn = false;
var userName = '';

// continuously fetch ripple transactions when tab is active
var Payments = require('../modules/payments/components/payments.jsx');
var paymentActions = require('../modules/payments/actions.js');
var heartbeats = require('heartbeats');
var pollingHeart = new heartbeats.Heart(1000);

var pollWhenActive = function() {
  if (isLoggedIn) {
    paymentActions.fetchNewRippleTransactions();
  }
};

// poll every 5 seconds
pollingHeart.onBeat(5, pollWhenActive);

window.onfocus = function() {
  pollingHeart.clearEvents();
  pollingHeart.onBeat(5, pollWhenActive);
};

window.onblur = function() {
  pollingHeart.onBeat(60 * 5, pollingHeart.clearEvents);
};

var App = require('./app.jsx');

var loginPath = '/login';
var logoutPath = '/logout';
var defaultPath = '/payments/outgoing/all';

var AppModule = React.createClass({
  mixins: [Navigation],

  getLogStatus: function(sessionModel) {
    return sessionModel.isLoggedIn();
  },

  getUserName: function(sessionModel) {
    return sessionModel.get('userModel').get('name');
  },

  handleRestore: function(payload) {

    // redirect to login if session restoration failed
    if (payload.success) {
      this.transitionTo(defaultPath);
    } else {
      this.transitionTo(loginPath);
    }

    // occurs before component mounts, so this cannot be set to state
    isLoggedIn = this.getLogStatus(payload.session);
    userName = this.getUserName(payload.session);
  },

  handleLogin: function(sessionModel) {
    this.transitionTo(defaultPath);

    isLoggedIn = this.getLogStatus(sessionModel);
    userName = this.getUserName(sessionModel);
  },

  handleLogout: function(payload) {
    this.transitionTo(loginPath);

    isLoggedIn = this.getLogStatus(payload.session);
  },

  componentWillMount: function() {
    sessionModel.on('attemptRestore', this.handleRestore);
  },

  componentDidMount: function() {
    sessionModel.on('sync', this.handleLogin);
    sessionModel.on('logout', this.handleLogout);

    this.forceUpdate();
  },

  componentWillUnmount: function() {
    sessionModel.off('attemptRestore sync logout');
  },

  render: function() {
    return (
      <App
        loginPath={loginPath}
        defaultPath={defaultPath}
        isLoggedIn={isLoggedIn}
        userName={userName}
      />
    );
  }
});

var SessionComponentModule = React.createClass({
  render: function() {
    return (
      <
        SessionComponent
          loginPath={loginPath}
          logoutPath={logoutPath}
          defaultPath={defaultPath}
      />
    );
  }
});

var PaymentsModule = React.createClass({
  render: function() {
    return (
      <Payments />
    );
  }
});

var routes = (
  <Route name="app" path="/" handler={AppModule}>
    <DefaultRoute handler={SessionComponentModule} />
    <Route name="login" handler={SessionComponentModule} />
    <Route name="logout" handler={SessionComponentModule} />
    <Route name="payments" path="payments/:direction/:state" handler={PaymentsModule}/>
    <Route name="notFound" handler={NotFound} />
    <NotFoundRoute handler={NotFound} />
    <Redirect from="/" to={loginPath} />
  </Route>
);

module.exports = routes;
