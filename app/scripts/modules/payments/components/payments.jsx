"use strict";

var _ = require('lodash');
var url = require('url');
var Backbone= require('backbone');

var React = require('react');
var DocumentTitle = require('react-document-title');

// React Router
var Router = require('react-router');
var ActiveState = require('react-router').ActiveState;
var Link = require('react-router').Link;


// React Bootstrap
var ModalTrigger = require('react-bootstrap').ModalTrigger;

var paymentActions = require('../actions.js');
var PaymentItem = require('./payment.jsx');

var Collection = require('../collections/payments.js');
var collection = new Collection();

var PaymentCreateFormModel = require('../models/payment-create.js');
var paymentCreateFormModel = new PaymentCreateFormModel();
var PaymentCreateForm = require('./payment-create.jsx');


var Payments = React.createClass({
  mixins: [ActiveState, Router.State],

  getInitialState: function() {

    // TODO - separate the backbone collection from the state and retrieve only its JSON representation
    return {
      payments: collection
    };
  },

  componentDidMount: function() {
    collection.on('sync', this.handleCollectionSync);
    paymentActions.updateUrl(this.getPath());
  },

  componentWillUnmount: function() {
    collection.off('sync');
  },

  // @data payment collection or model
  handleCollectionSync: function(data) {

    // TODO - is there a better way to handle separation of collection vs model syncs?
    if (data instanceof Backbone.Model) {

      // changing a model in the collection/state won't trigger a re-render
      this.forceUpdate();

      return false;
    } else {
      this.setState({
        payments: data
      });
    }
  },

  handleRetryButtonClick: function(id) {
    paymentActions.retryFailedPayment(id);
  },

  directionMap: {
    incoming: "from-ripple",
    outgoing: "to-ripple"
  },

  createTitle: function(direction) {
    direction = direction || 'incoming';

    var titleMap = {
      incoming: 'Received Payments',
      outgoing: 'Sent Payments'
    };

    return titleMap[direction];
  },

  render: function() {
    var _this = this,
        direction = this.getParams().direction,
        state = this.getParams().state,
        tertiaryNav;

    // less than ideal, will refactor when we have pagination, if not sooner.
    // We could keep different collections for each type, but it depends on use case.
    var paymentItems = this.state.payments.chain()
      .filter(function(model) {
        return model.get('direction') === _this.directionMap[direction];
      })
      .filter(function(model) {
        return state === 'all'? true : model.get('state') === state;
      })
      .map(function(model) {
        return (
          <PaymentItem
            key={model.get('id')}
            model={model}
            retryButtonClickHandler={this.handleRetryButtonClick}
          />
        );
    }, this);

    //todo make separate component with iterator. Oy.
    if (direction === 'incoming') {
      tertiaryNav = (
        <div className="nav-tertiary">
          <Link to='payments' params={{direction: 'incoming', state: 'all'}}>All</Link>
          <Link to='payments' params={{direction: 'incoming', state: 'incoming'}}>Queued</Link>
          <Link to='payments' params={{direction: 'incoming', state: 'succeeded'}}>Succeeded</Link>
        </div>);
    } else {
      tertiaryNav = (
        <div className="nav-tertiary">
          <Link to='payments' params={{direction: 'outgoing', state: 'all'}}>All</Link>
          <Link to='payments' params={{direction: 'outgoing', state: 'outgoing'}}>Queued</Link>
          <Link to='payments' params={{direction: 'outgoing', state: 'pending'}}>Pending</Link>
          <Link to='payments' params={{direction: 'outgoing', state: 'succeeded'}}>Succeeded</Link>
          <Link to='payments' params={{direction: 'outgoing', state: 'failed'}}>Failed</Link>
        </div>);
    }

    return (
      <DocumentTitle title={this.createTitle(direction)}>
        <div>
          <div className="row">
            <div className="col-sm-12 col-xs-12">
              <h1>Payments:
                <span className="header-links">
                  <Link to='payments' params={{direction: 'outgoing', state: 'all'}}>
                    Sent
                  </Link>
                  <Link to='payments' params={{direction: 'incoming', state: 'all'}}>
                    Received
                  </Link>
                  <ModalTrigger modal={<PaymentCreateForm model={paymentCreateFormModel} />}>
                    <a>Send Payment</a>
                  </ModalTrigger>
                </span>
              </h1>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              {tertiaryNav}
            </div>
          </div>
          <div className="row">
            <ul className="list-group">
              {paymentItems}
            </ul>
          </div>
        </div>
      </DocumentTitle>
    );
  }
});

module.exports = Payments;
