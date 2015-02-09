"use strict";

var _ = require('lodash');
var url = require('url');
var Backbone= require('backbone');

var stringLib = require('../../../../i18n/messages');
var ReactIntl = require('react-intl');
var IntlMixin = ReactIntl.IntlMixin;
var FormattedMessage = ReactIntl.FormattedMessage;
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
  mixins: [IntlMixin, ActiveState, Router.State],

  getInitialState: function() {
    return {
      payments: []
    };
  },

  componentDidMount: function() {
    collection.on('fetchedTransactions', this.handleCollectionSync);

    //this handles the model polling for 'retry'
    collection.on('polling', this.handlePolling);
    collection.on('refreshedTransactions', this.handleCollectionSync);

    paymentActions.updateUrl(this.getPath());
  },

  componentWillUnmount: function() {
    collection.off('fetchedTransactions refreshedTransactions polling');
  },

  handlePolling: function(data) {
    var payment =  _.find(this.state.payments, {id: data.id});

    payment.isPolling = data.isPolling;

    //todo: find more performant way to handle data
    this.forceUpdate();
  },

  handleCollectionSync: function(data) {
    this.setState({
      payments: data.toJSON()
    });
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
      incoming: this.getIntlMessage('paymentsTitleReceived'),
      outgoing: this.getIntlMessage('paymentsTitleSent')
    };

    return titleMap[direction];
  },

  setDefaults: function(a, b) {
    return (_.isNull(a) || _.isUndefined(a)) ? b : a;
  },

  render: function() {
    var _this = this,
        direction = this.getParams().direction,
        state = this.getParams().state,
        tertiaryNav;

    // less than ideal, will refactor when we have pagination, if not sooner.
    // We could keep different collections for each type, but it depends on use case.
    var paymentItems = _.chain(this.state.payments)
      .filter(payment => {
        return payment.direction === _this.directionMap[direction];
      })
      .filter(payment => {
        return state === 'all' ? true : (payment.state === state);
      })
      .map(payment => {
        var addressDefaults = {
          address: 'none',
          tag: 'none',
          uid: null,
          data: null
        };

        var defaults = {
          invoice_id: 'none',
          transaction_hash: 'none'
        };

        payment = _.merge(payment, defaults, this.setDefaults);
        payment.toAddress = _.merge((payment.toAddress || {}), addressDefaults, this.setDefaults);
        payment.fromAddress = _.merge((payment.fromAddress || {}), addressDefaults, this.setDefaults);

        return (
          <PaymentItem
            key={payment.id}
            {...payment}
            retryButtonClickHandler={this.handleRetryButtonClick}
          />
        );
    }, this);

    //todo make separate component with iterator. Oy.
    if (direction === 'incoming') {
      tertiaryNav = (
        <div className="nav-tertiary">
          <Link to='payments' params={{direction: 'incoming', state: 'all'}}>
            <FormattedMessage message={this.getIntlMessage('paymentsNavAll')} />
          </Link>
          <Link to='payments' params={{direction: 'incoming', state: 'incoming'}}>
            <FormattedMessage message={this.getIntlMessage('paymentsNavQueued')} />
          </Link>
          <Link to='payments' params={{direction: 'incoming', state: 'succeeded'}}>
            <FormattedMessage message={this.getIntlMessage('paymentsNavSucceeded')} />
          </Link>
        </div>);
    } else {
      tertiaryNav = (
        <div className="nav-tertiary">
          <Link to='payments' params={{direction: 'outgoing', state: 'all'}}>
            <FormattedMessage message={this.getIntlMessage('paymentsNavAll')} />
          </Link>
          <Link to='payments' params={{direction: 'outgoing', state: 'outgoing'}}>
            <FormattedMessage message={this.getIntlMessage('paymentsNavQueued')} />
          </Link>
          <Link to='payments' params={{direction: 'outgoing', state: 'pending'}}>
            <FormattedMessage message={this.getIntlMessage('paymentsNavPending')} />
          </Link>
          <Link to='payments' params={{direction: 'outgoing', state: 'succeeded'}}>
            <FormattedMessage message={this.getIntlMessage('paymentsNavSucceeded')} />
          </Link>
          <Link to='payments' params={{direction: 'outgoing', state: 'failed'}}>
            <FormattedMessage message={this.getIntlMessage('paymentsNavFailed')} />
          </Link>
        </div>);
    }

    return (
      <DocumentTitle title={this.createTitle(direction)}>
        <div>
          <div className="row">
            <div className="col-sm-12 col-xs-12">
              <h1>
                <FormattedMessage message={this.getIntlMessage('paymentsHeader')} />
                <span className="header-links">
                  <Link to='payments' params={{direction: 'outgoing', state: 'all'}}>
                    <FormattedMessage message={this.getIntlMessage('paymentsNavSent')} />
                  </Link>
                  <Link to='payments' params={{direction: 'incoming', state: 'all'}}>
                    <FormattedMessage message={this.getIntlMessage('paymentsNavReceived')} />
                  </Link>
                  <ModalTrigger modal={<PaymentCreateForm {...stringLib} model={paymentCreateFormModel} />}>
                    <a>
                      <FormattedMessage message={this.getIntlMessage('paymentsNavSendPayment')} />
                    </a>
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
