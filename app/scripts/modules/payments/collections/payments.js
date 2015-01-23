"use strict";

var _ = require('lodash');
var $ = require('jquery');
var Backbone = require('backbone');
var adminDispatcher = require('../../../dispatchers/admin-dispatcher');
var paymentConfigActions = require('../config.json').actions;
var session = require('../../../modules/session/models/session');
var Model = require('../models/payment.js');

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
    this.fetch({
      headers: {
        Authorization: session.get('credentials')
      }
    });
  },

  getNewTransactionsUrl: function(id) {
    return this.url + '&sort_direction=asc' + '&index=' + id;
  },

  fetchNewRippleTransactions: function() {

    //if collection is empty, do a normal fetch
    if (!this.at(0)) {
      this.fetchRippleTransactions();
      return false;
    }

    var _this = this,
        url = this.getNewTransactionsUrl(this.at(0).get('id'));

    this.fetch({
      url: url,
      remove: false,
      headers: {
        Authorization: session.get('credentials')
      },
      success: function(coll, r) {
        _this.trigger("addedNew", {test: true});
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
