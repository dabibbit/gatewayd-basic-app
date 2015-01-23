"use strict";

var _ = require('lodash');
var moment = require('moment');
var React = require('react');
var ModalTrigger = require('react-bootstrap').ModalTrigger;
var PaymentDetailModal = require('./payment-detail-modal.jsx');
var Address = require('./address.jsx');
var PaymentDetailContent = require('./payment-detail-content.jsx');
var Chevron = require('../../../shared/components/glyphicon/chevron.jsx');

var Payment = React.createClass({
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

  render: function() {
    var rippleGraphLink = 'http://www.ripplecharts.com/#/graph/' + this.props.transaction_hash;
    var getRefreshIconClass = function(isPolling) {
      return isPolling ? 'glyphicon glyphicon-refresh glyphicon-spin' : '';
    };
    var doneButton, retryLink, refreshIcon, fromAddress, toAddress;

    // display 'From Address' for received payments or 'To Address' for sent payments
    if (this.props.direction === 'from-ripple') {
      fromAddress = (
        <Address
          direction="from"
          address={this.props.fromAddress.address}
        />
      );
      toAddress = <p>&nbsp;</p>;
    } else {
      toAddress = (
        <Address
          direction="to"
          address={this.props.toAddress.address}
        />
      );
      fromAddress = <p>&nbsp;</p>;
    }

    if (this.props.state === 'incoming') {
      doneButton = (
        <ModalTrigger modal={<PaymentDetailModal model={this.props.model} />}>
          <button className="btn pull-right">
            Process
          </button>
        </ModalTrigger>
      );
    } else {
      doneButton = false;
    }

    // show retry link for failed payments
    if (this.props.state === 'failed') {
      retryLink=(
        <a onClick={this.handleRetryButtonClick.bind(this,this.props.id)}>
          Retry?
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
              <span className="header">To Amount: </span>
              <span className="data">{this.props.to_amount} </span>
              <span className="currency">{this.props.to_currency}</span>
            </p>
            {toAddress}
            <p>
              <span className="header">Destination Tag:</span>
            </p>
            {this.props.toAddress.tag}
          </div>
          <div className="col-sm-4">
            <p>
              <span className="header">From Amount: </span>
              <span className="data">{this.props.from_amount} </span>
              <span className="currency">{this.props.from_currency}</span>
            </p>
            {fromAddress}
          </div>
          <div className="col-sm-4 text-right">
            <p>
              <span className="header">Status: </span>
              <span className="data">{this.props.state} </span>
              <span className="header">{retryLink} </span>
              <span className={getRefreshIconClass(this.props.isPolling)} />
            </p>
            {doneButton}
          </div>
        </div>
        <div className="row">
          <div className="col-sm-8">
          </div>
          <div className="col-sm-4">
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12">
            <a href={rippleGraphLink} target="_blank">Ripple Graph Link</a>
          </div>
        </div>
        <div className="clearfix">
          <span className="date pull-left">
            {moment(this.props.createdAt).format('MMM D, YYYY HH:mm z')}
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
