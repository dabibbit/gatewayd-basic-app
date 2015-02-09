"use strict";

var React = require('react');
var Wallet = require('./wallet.jsx');
var walletActions = require('../actions');
var Balances = require('../collections/balances');
var hotWalletBalances = new Balances([], {walletType: 'hot'});
var coldWalletBalances = new Balances([], {walletType: 'cold'});

var Wallets = React.createClass({

  componentDidMount: function() {
    var _this = this;

    hotWalletBalances.on('sync', function() {
      _this.forceUpdate();
    });

    coldWalletBalances.on('sync', function() {
      _this.forceUpdate();
    });

    walletActions.fetchBalances();
  },

  componentWillUnmount: function() {
    hotWalletBalances.off('sync');
    coldWalletBalances.off('sync');
  },

  render: function() {
    return (
      <div>
        <Wallet headerType={"hotWalletHeader"} collection={hotWalletBalances} />
        <Wallet headerType={"coldWalletHeader"} collection={coldWalletBalances} />
      </div>
    );
  }
});

module.exports = Wallets;
