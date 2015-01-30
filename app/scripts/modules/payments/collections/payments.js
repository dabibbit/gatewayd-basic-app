"use strict";

var _ = require('lodash');
var $ = require('jquery');
var Backbone = require('backbone');
var adminDispatcher = require('../../../dispatchers/admin-dispatcher');
var paymentConfigActions = require('../config.json').actions;
var session = require('../../../modules/session/models/session');
var Model = require('../models/payment.js');
var moment = require('moment');

Backbone.$ = $;

var Payments = Backbone.Collection.extend({

  model: Model,

  comparator: function(a, b) {
    return b.id - a.id;
  },

  initialize: function() {
    _.bindAll(this);

    adminDispatcher.register(this.dispatcherCallback);
  },

  dispatcherCallback: function(payload) {
    if (!_.isUndefined(this[payload.actionType])) {
      this[payload.actionType](payload.data);
    }
  },

  urlObject: {
    "payments": {
      "path":"/v1/ripple_transactions",
      "method": "get"
    },
    "incoming": {
      "path":"/v1/ripple_transactions",
      "method": "get"
    },
    "succeded": {
      "path":"/v1/ripple_transactions",
      "method": "get"
    },
    "failed": {
      "path":"/v1/ripple_transactions",
      "method": "get"
    },
    "outgoing": {
      "path":"/v1/ripple_transactions",
      "method": "get"
    },
    "new": {
      "path":"/v1/ripple_transactions",
      "method": "get"
    },
    "flagAsDone": {
      "path":"/v1/ripple_transactions/",
      "method": "save"
    }
  },

  updateUrl: function(page) {
    page = page.split('/')[2];

    if (!page || _.isUndefined(this.urlObject[page])) {
      return false;
    }

    //todo create url factory to handle query strings
    this.url = session.get('gatewaydUrl') + this.urlObject[page].path + '?count=200';
    this.httpMethod = this.urlObject[page].method;

    this.fetchRippleTransactions();
  },

  flagAsDone: function(id) {
    var model = this.get(id);

    model.set({
      state: 'succeeded'
    });

    model.save('state', 'succeeded', {
      url: session.get('gatewaydUrl') + this.urlObject.flagAsDone.path + id,
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', session.get('credentials'));
      }
    });
  },

  fetchRippleTransactions: function() {
    var _this = this;

    this.fetch({
      headers: {
        Authorization: session.get('credentials')
      },
      success: function(coll, r) {
        _this.trigger("fetchedTransactions", coll);
      }
    });
  },

  setLatestPayment: function(payments) {
    var newestUpdatedPayment;

    // todo: can't rely on response sorting at the moment
    // look into timestamp issues later
    if (payments.length) {
      newestUpdatedPayment = _.max(payments, function(payment) {
        return Date.parse(payment.updatedAt);
      });

      this.latestPayment = newestUpdatedPayment.updatedAt;
    } else {
      this.latestPayment = this.at(0).get('updatedAt');
    }
  },

  getLatestPayment: function() {
    return this.latestPayment || this.at(0).get('updatedAt');
  },

  getNewTransactionsUrl: function() {
    var timeStamp = encodeURIComponent(moment(this.getLatestPayment())
                                       .format('YYYY-MM-DD HH:mm:ss.SSS'));

    return this.url + '&sort_direction=asc' + '&index=' + timeStamp;
  },

  fetchNewRippleTransactions: function() {

    var firstModel = this.at(0);

    //if collection is empty, do a normal fetch
    //this is required since there is no first index from which to pull
    if (!firstModel) {
      this.fetchRippleTransactions();
      return false;
    }

    var _this = this,
        url = this.getNewTransactionsUrl();

    this.fetch({
      url: url,
      remove: false,
      headers: {
        Authorization: session.get('credentials')
      },
      success: function(coll, r) {

        //do nothing if nothing returned
        if (!r.ripple_transactions.length) {
          return false;
        }

        //todo: not sure why we need to set explicitly
        //rather than letting bbone merge data
        _this.set(r.ripple_transactions, {remove: false});
        _this.trigger("refreshedTransactions", coll);
        _this.setLatestPayment(r.ripple_transactions);
      }
    });
  },

  parse: function(data) {
    return data.ripple_transactions;
  },

  sendPaymentComplete: function(paymentData) {
    var _this = this;

    this.fetch({
      headers: {
        Authorization: session.get('credentials')
      },
      success: function() {

        // poll status of sent payment until failed/succeeded to see changes
        _this.get(paymentData.id).pollStatus();
      }
    });
  }
});

module.exports = Payments;
