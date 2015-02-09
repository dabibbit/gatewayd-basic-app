"use strict";

var _ = require('lodash');
var moment = require('moment');
var ReactIntl = require('react-intl');
var IntlMixin = ReactIntl.IntlMixin;
var FormattedMessage = ReactIntl.FormattedMessage;
var React = require('react');
var ResizeSpan = require('./resize-span.jsx');

var PaymentDetailContent = React.createClass({

  mixins: [IntlMixin],

  propTypes: {
    paymentDetailClassName: React.PropTypes.string
  },

  getFormattedString: function(key) {
    if (!key) {
      return false;
    }

    return (
      <FormattedMessage
        message={this.getIntlMessage(key)}
      />
    );
  },

  render: function() {
    return (
      <div className={this.props.paymentDetailClassName}>
        <div className="row border-bottom">
          <FormattedMessage
            updatedAt={moment(this.props.updatedAt).format('MMM D, YYYY HH:mm z')}
            message={this.getIntlMessage('paymentUpdated')}
          />
        </div>
        <div className="row">
          <FormattedMessage
            id={this.props.id}
            message={this.getIntlMessage('paymentTransactionId')}
          />
        </div>
        <div className="row">
          <div className="col-sm-5 border-bottom">
            <div className="row">
              <div className="col-sm-12">
                <ResizeSpan
                  header={this.getFormattedString('paymentFromAddress')}
                  data={this.props.fromAddress.address}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                <span className="header">
                  <FormattedMessage
                    message={this.getIntlMessage('paymentTag')}
                  />
                </span>
                <span className="data">{this.props.fromAddress.tag}</span>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                <span className="header">
                  <FormattedMessage
                    message={this.getIntlMessage('paymentBalanceChanges')}
                  />
                </span>
                <span className="data">{this.props.from_amount} </span>
                <span className="currency">{this.props.from_currency}</span>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-sm-offset-1 border-bottom">
            <div className="row">
              <div className="col-sm-12">
                <ResizeSpan
                  header={this.getFormattedString('paymentToAddress')}
                  data={this.props.toAddress.address}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                <span className="header">
                  <FormattedMessage
                    message={this.getIntlMessage('paymentTag')}
                  />
                </span>
                <span className="data">{this.props.toAddress.tag}</span>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                <span className="header">
                  <FormattedMessage
                    message={this.getIntlMessage('paymentBalanceChanges')}
                  />
                </span>
                <span className="data">+{this.props.to_amount} </span>
                <span className="currency">{this.props.to_currency}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <ResizeSpan
            header={this.getFormattedString('paymentInvoiceId')}
            data={this.props.invoice_id}
          />
        </div>
        <div className="row">
          <ResizeSpan
            header={this.getFormattedString('paymentTransactionHash')}
            data={this.props.transaction_hash}
          />
        </div>
        <div className="row">
          <span className="header">
            <FormattedMessage message={this.getIntlMessage('paymentMemos')} />
          </span>
          <span className="data">
            { !_.isEmpty(this.props.memos) ?
              this.props.memos[0].MemoData : this.getFormattedString('resultsNone')
            }
          </span>
        </div>
      </div>
    );
  }
});

module.exports = PaymentDetailContent;
