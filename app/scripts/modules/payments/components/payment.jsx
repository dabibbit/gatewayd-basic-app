"use strict";

var stringLib = require('../../../../i18n/messages');
var _ = require('lodash');
var moment = require('moment');
var ReactIntl = require('react-intl');
var IntlMixin = ReactIntl.IntlMixin;
var FormattedMessage = ReactIntl.FormattedMessage;
var React = require('react');
var ModalTrigger = require('react-bootstrap').ModalTrigger;
var PaymentDetailModal = require('./payment-detail-modal.jsx');
var ResizeSpan = require('./resize-span.jsx');
var PaymentDetailContent = require('./payment-detail-content.jsx');
var Chevron = require('../../../shared/components/glyphicon/chevron.jsx');

var Payment = React.createClass({

  mixins: [IntlMixin],

  propTypes: {
    retryButtonClickHandler: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      isPolling: false
    };
  },

  handleDetailIconClick: function(id) {
    this.setState({
      showDetails: !this.state.showDetails
    });
  },

  handleRetryButtonClick: function(id, e) {
    this.props.retryButtonClickHandler(id);
  },

  getInitialState: function() {
    return {
      showDetails: false
    };
  },

  getAddressData: function(direction) {
    var headerFrom, headerTo;

    headerFrom = <FormattedMessage message={this.getIntlMessage('paymentFromAddress')} />;
    headerTo = <FormattedMessage message={this.getIntlMessage('paymentToAddress')} />;

    if (direction === 'from-ripple') {
      return {
        fromAddress: (<ResizeSpan
          header={headerFrom}
          data={this.props.fromAddress.address}
        />),
        toAddress: <p>&nbsp;</p>
      }
    } else {
      return {
        toAddress: (<ResizeSpan
          header={headerTo}
          data={this.props.toAddress.address}
        />),
        fromAddress: <p>&nbsp;</p>
      }
    }
  },

  getDoneButton: function(state) {

    //todo: this is a temp hack to hide the done button
    if (state === 'thisShouldNeverShow') {

      //todo, roll our own modals
      //must pass stringLib back in here since the modal is not rendered
      //as part of the top level wrapper node
      return (
        <ModalTrigger  modal={<PaymentDetailModal {...stringLib} {...this.props} />}>
          <button className="btn pull-right">
            <FormattedMessage message={this.getIntlMessage('paymentProcess')} />
          </button>
        </ModalTrigger>
      );
    } else {
      return false;
    }
  },

  render: function() {
    var rippleGraphLink, getRefreshIconClass, retryLink;

    rippleGraphLink = `http://www.ripplecharts.com/#/graph/${this.props.transaction_hash}`;

    //todo use inline helper method where setting className
    getRefreshIconClass = function(isPolling) {
      return isPolling ? 'glyphicon glyphicon-refresh glyphicon-spin' : '';
    };

        // show retry link for failed payments
    if (this.props.state === 'failed') {
      retryLink=(
        <a onClick={this.handleRetryButtonClick.bind(this,this.props.id)}>
          <FormattedMessage message={this.getIntlMessage('paymentRetry')} />
        </a>
      );
    } else {
      retryLink = false;
    }

    return (
      <li className="payment-item list-group-item animated fade-in modal-container" ref="container">
        <div className="row">
          <div className="col-sm-4">
            <p>
              <span className="header">
                <FormattedMessage message={this.getIntlMessage('paymentToAmount')} />
              </span>
              <span className="data">{this.props.to_amount}</span>
              <span className="currency">{this.props.to_currency}</span>
            </p>
            {this.getAddressData(this.props.direction).toAddress}
            <p>
              <span className="header">
                <FormattedMessage message={this.getIntlMessage('paymentDestinationTag')} />
              </span>
              <span className="data">{this.props.toAddress.tag}</span>
            </p>
          </div>
          <div className="col-sm-4">
            <p>
              <span className="header">
                <FormattedMessage message={this.getIntlMessage('paymentFromAmount')} />
              </span>
              <span className="data">{this.props.from_amount}</span>
              <span className="currency">{this.props.from_currency}</span>
            </p>
            {this.getAddressData(this.props.direction).fromAddress}
          </div>
          <div className="col-sm-4 text-right">
            <p>
              <span className="header">
                <FormattedMessage message={this.getIntlMessage('paymentStatus')} />
              </span>
              <span className="data">{this.props.state} </span>
              <span className="header">{retryLink} </span>
              <span className={getRefreshIconClass(this.props.isPolling)} />
            </p>
            {this.getDoneButton(this.props.state)}
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12">
            <a href={rippleGraphLink} target="_blank">
              <FormattedMessage message={this.getIntlMessage('paymentGraphLink')} />
            </a>
          </div>
        </div>
        <div className="clearfix">
          <span className="date pull-left">
            {moment(this.props.createdAt).format('MMM D, YYYY HH:mm:ss.SSS z')}
          </span>
          <Chevron
            clickHandler={this.handleDetailIconClick.bind(this, this.props.id)}
            iconClasses="pull-right"
          />
        </div>
        <div>
          {this.state.showDetails ?
            <PaymentDetailContent {...this.props} paymentDetailClassName={"details"}/>
            : false}
        </div>
      </li>
    );
  }
});

module.exports = Payment;
