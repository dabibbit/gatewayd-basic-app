"use strict";

var _ = require('lodash');
var moment = require('moment');
var ResizeSpan = require('./resize-span.jsx');

var React = require('react');

var PaymentDetailContent = React.createClass({
  propTypes: {
    paymentDetailClassName: React.PropTypes.string
  },

  render: function() {
    return (
      <div className={this.props.paymentDetailClassName}>
        <div className="row border-bottom">
          Updated {moment(this.props.updatedAt).format('MMM D, YYYY HH:mm z')}
        </div>
        <br />
        <div className="row">
          Transaction Id: {this.props.id}
        </div>
        <br />
        <div className="row">
        </div>
        <div className="row">
          <div className="col-sm-5 border-bottom">
            <div className="row">
              <div className="col-sm-12">
                <ResizeSpan
                  header="From Address"
                  data={this.props.fromAddress.address}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                <span className="header">Tag:</span>
              </div>
              <div className="col-sm-9">
                <span className="data">{this.props.fromAddress.tag}</span>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                <span className="header">Balance Changes:</span>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-9 col-sm-offset-3">
                <span className="data">{this.props.from_amount} </span>
                <span className="currency">{this.props.from_currency}</span>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-sm-offset-1 border-bottom">
            <div className="row">
              <div className="col-sm-12">
                <ResizeSpan
                  header="To Address"
                  data={this.props.toAddress.address}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                <span className="header">Tag:</span>
              </div>
              <div className="col-sm-9">
                <span className="data">{this.props.toAddress.tag}</span>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                <span className="header">Balance Changes:</span>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-9 col-sm-offset-3">
                <span className="data">+{this.props.to_amount} </span>
                <span className="currency">{this.props.to_currency}</span>
              </div>
            </div>
          </div>
        </div>
        <br />
        <div className="row">
          <ResizeSpan
            header="Invoice Id"
            data={this.props.invoice_id}
          />
        </div>
        <br />
        <div className="row">
          <ResizeSpan
            header="Transaction Hash"
            data={this.props.transaction_hash}
          />
        </div>
        <br />
        <div className="row">
          <span className="header">Memos: </span>
          <span className="data">
            { !_.isEmpty(this.props.memos) ?
              this.props.memos[0].MemoData : 'none'
            }
          </span>
        </div>
      </div>
    );
  }
});

module.exports = PaymentDetailContent;
