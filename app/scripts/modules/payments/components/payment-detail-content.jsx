"use strict";

var _ = require('lodash');
var moment = require('moment');
var Address = require('./address.jsx');

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
                <Address
                  direction="from"
                  address={this.props.fromAddress.address}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                Tag:
              </div>
              <div className="col-sm-9">
                {this.props.fromAddress.tag}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                Balance Changes:
              </div>
            </div>
            <div className="row">
              <div className="col-sm-9 col-sm-offset-3">
                {this.props.from_amount} {this.props.from_currency}
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-sm-offset-1 border-bottom">
            <div className="row">
              <div className="col-sm-12">
                <Address
                  direction="to"
                  address={this.props.toAddress.address}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                Tag:
              </div>
              <div className="col-sm-9">
                {this.props.toAddress.tag}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                Balance Changes:
              </div>
            </div>
            <div className="row">
              <div className="col-sm-9 col-sm-offset-3">
                +{this.props.to_amount} {this.props.to_currency}
              </div>
            </div>
          </div>
        </div>
        <br />
        <div className="row">
          Invoice Id: {this.props.invoice_id}
        </div>
        <br />
        <div className="row">
          Transaction Hash: {this.props.transaction_hash}
        </div>
        <br />
        <div className="row">
          Memos: { !_.isEmpty(this.props.memos) ?
            this.props.memos[0].MemoData : 'none'
          }
        </div>
      </div>
    );
  }
});

module.exports = PaymentDetailContent;
