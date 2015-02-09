"use strict";

var ReactIntl = require('react-intl');
var IntlMixin = ReactIntl.IntlMixin;
var FormattedMessage = ReactIntl.FormattedMessage;
var React = require('react');
var WalletEntry = require('./wallet-entry.jsx');

var Wallet = React.createClass({
  mixins: [IntlMixin],

  propTypes: {
    headerType: React.PropTypes.string,
    collection: React.PropTypes.object
  },

  render: function() {
    var buildBalanceEntries;

    buildBalanceEntries = balances => {
      return this.props.collection.map(model => {
        return (
          <WalletEntry
            key={model.cid}
            currency={model.get('currency')}
            value={model.get('value')}
            counterparty={model.get('counterparty')}
          />
        );
      });
    };

    return (
      <div>
        <h3>
          <FormattedMessage
            message={this.getIntlMessage(this.props.headerType)}
          />
        </h3>
        <ul className="wallet">
          <li className="list-group-item wallet-header">
            <div className="row">
              <div className="col-sm-3 col-xs-6">
                <strong>
                  <FormattedMessage
                    message={this.getIntlMessage('walletCurrency')}
                  />
                </strong>
              </div>
              <div className="col-sm-3 col-xs-6 col-sm-offset-1">
                <strong>
                  <FormattedMessage
                    message={this.getIntlMessage('walletValue')}
                  />
                </strong>
              </div>
            </div>
          </li>
          {buildBalanceEntries(this.props.collection)}
        </ul>
      </div>
    );
  }
});

module.exports = Wallet;
