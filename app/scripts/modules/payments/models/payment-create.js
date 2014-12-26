"use strict";

var _ = require('lodash');
var $ = require('jquery');
var RippleName = require('ripple-name');
var Backbone = require('backbone');
var ValidationMixins = require('../../../shared/helpers/validation_mixin');
var adminDispatcher = require('../../../dispatchers/admin-dispatcher');
var paymentConfigActions = require('../config.json').actions;
var session = require('../../session/models/session');

Backbone.$ = $;

var Payment = Backbone.Model.extend({
  defaults: {
    address: '',
    amount: 0,
    currency: '',
    destinationTag: 0,
    source_tag: 0,
    invoice_id: '',
    memos: []
  },

  validationRules: {
    address: {
      validators: ['isRequired', 'isString', 'minLength:1']
    },
    unprocessed_address: {
      validators: ['isRequired', 'isString', 'minLength:1']
    },
    amount: {
      validators: ['isRequired', 'isNumber'] // decimal
    },
    currency: {
      validators: ['isRequired', 'isString', 'minLength:1']
    },
    destinationTag: {
      validators: ['isNumber']
    },
    source_tag: {
      validators: ['isNumber']
    },
    invoice_id: {
      validators: ['isString', 'minLength:1']
    },
    memos: {
      validators: ['isArray']
    },
    unprocessed_memos: {
      validators: ['isString', 'minLength:1']
    }
  },

  initialize: function() {
    _.bindAll(this);

    adminDispatcher.register(this.dispatchCallback);
  },

  dispatchCallback: function(payload) {
    var handleAction = {};

    handleAction[paymentConfigActions.reset] = this.reset;
    handleAction[paymentConfigActions.sendPaymentAttempt] = this.sendPaymentAttempt;
    handleAction[paymentConfigActions.validateField] = this.validateField;
    handleAction[paymentConfigActions.validateAddress] = this.validateAddress;

    if (!_.isUndefined(handleAction[payload.actionType])) {
      handleAction[payload.actionType](payload.data);
    }
  },

  reset: function() {
    this.clear().set(this.defaults);
  },

  postPayment: function() {
    this.save(null, {
      url: session.get('gatewaydUrl') + '/v1/payments/outgoing',
      contentType: 'application/json',
      headers: {
        Authorization: session.get('credentials')
      }
    });
  },

  createMemo: function(memoString) {
    var memos = [];
    var memo = {};

    memo.MemoData = memoString;

    memos.push(memo);

    return JSON.stringify(memos);
  },

  validateField: function(data) {
    var attributeValidation = this.attributeIsValid(data.fieldName, data.fieldValue);

    if (attributeValidation.result) {
      this.trigger('validationComplete', true, data.fieldName, '');

      if (data.fieldName === 'unprocessed_memos') {
        this.trigger('memosProcessed', this.createMemo(data.fieldValue));
      }
    } else {
      this.trigger('validationComplete', false, data.fieldName, attributeValidation.errorMessages);
    }
  },

  validateAddress: function(address) {
    var _this = this;

    RippleName.lookup(address)
    .then(function(data) {
      if (data.exists) {
        _this.validateField({
          fieldName: 'unprocessed_address',
          fieldValue: data.address
        });

        _this.trigger('addressProcessed', data.address);
      } else {
        _this.trigger('validationComplete', false, 'unprocessed_address', 'ripple name/address does not exist');
      }
    })
    .error(function() {
      _this.trigger('validationComplete', false, 'unprocessed_address', 'ripple name lookup failed');
    });
  },

  sendPaymentAttempt: function(payment) {
    if (!_.isEmpty(payment.memos)) {
      payment.memos = JSON.parse(payment.memos);
    }

    this.set(payment);

    if (this.isValid()) {
      this.postPayment();
    }
  }
});

//add validation mixin
_.extend(Payment.prototype, ValidationMixins);

module.exports = Payment;
