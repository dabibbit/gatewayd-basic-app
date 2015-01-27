"use strict";

var React = require('react');

// React Router
var RouteHandler = require('react-router').RouteHandler;
var Navigation = require('react-router').Navigation;
var DocumentTitle = require('react-document-title');

// session model and dispatch actions
var sessionActions = require('../modules/session/actions');

// React components
var TopBar = require('../shared/components/header/top-bar.jsx');
var Sidebar = require('../shared/components/sidebar.jsx');
var Wallets = require('../modules/wallets/components/wallets.jsx');

// required to use React Bootstrap in child modules
require('react-bootstrap');

var topBarConfig = {
  brandName: 'Gatewayd Basic',
  wrapperClassName: 'navbar-inverse navbar-fixed-top top-bar container-fluid',
  links: []
};

var App =
  React.createClass({
    mixins: [Navigation],

    propTypes: {
      isLoggedIn: React.PropTypes.bool,
      userName: React.PropTypes.string,
      loginRoute: React.PropTypes.string,
      defaultRoute: React.PropTypes.string
    },

    getDefaultProps: function() {
      return {
        isLoggedIn: false,
        userName: '',
        loginRoute: '/',
        defaultRoute: '/'
      };
    },

    getInitialState: function() {
      return { showSidebar: false };
    },

    expandSidebar: function() {
      if (this.props.isLoggedIn) {
        this.setState({showSidebar: this.state.showSidebar ? false : true});
      } else {
        this.setState({showSidebar: false});
      }
    },

    render:function(){
      if (!this.props.isLoggedIn) {

        // attempt session restoration
        sessionActions.restore();

        // redirect to login if session restoration failed
        if (!this.props.isLoggedIn) {
          this.transitionTo(this.props.loginRoute);
        } else {
          this.transitionTo(this.props.defaultRoute);
        }
      }

      return (
        <div>
          <TopBar
            links={topBarConfig.links}
            brandName={topBarConfig.brandName}
            wrapperClassName={topBarConfig.wrapperClassName}
            expandSidebar={this.expandSidebar}
            userName={this.props.userName}
            isLoggedIn={this.props.isLoggedIn}
          />
          {this.state.showSidebar ?
            <Sidebar sidebarClassName="sidebar sidebar-wallets">
              <Wallets />
            </Sidebar>
            : false
          }
          <div className="container">
            <div className="row">
              <div className="col-sm-12 col-md-12 main">
              <DocumentTitle title="Gatewayd Basic Admin">
                <RouteHandler />
              </DocumentTitle>
              </div>
            </div>
          </div>
        </div>
      )
    }
});

module.exports = App;
