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

var sessionModel = require('../modules/session/models/session');
var SessionComponent = require('../modules/session/components/session.jsx');

// continuously fetch ripple transactions when tab is active
var Payments = require('../modules/payments/components/payments.jsx');
var paymentActions = require('../modules/payments/actions.js');
var heartbeats = require('heartbeats');
var pollingHeart = new heartbeats.Heart(1000);

var pollWhenActive = function() {
  if (sessionModel.isLoggedIn()) {
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

var loginRoute = '/login';
var logoutRoute = '/logout';
var defaultRoute = '/payments/outgoing/all';

var AppModule = React.createClass({
  render: function() {
    return (
      <App
        loginRoute={loginRoute}
        defaultRoute={defaultRoute}
        isLoggedIn={sessionModel.isLoggedIn()}
        userName={sessionModel.get('userModel').get('name')}
      />
    );
  }
});

var SessionComponentModule = React.createClass({
  render: function() {
    return (
      <
        SessionComponent
          loginRoute={loginRoute}
          logoutRoute={logoutRoute}
          defaultRoute={defaultRoute}
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
    <Redirect from="/" to={loginRoute} />
  </Route>
);

module.exports = routes;
