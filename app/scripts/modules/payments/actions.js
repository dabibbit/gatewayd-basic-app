"use strict";

var adminDispatcher = require('../../dispatchers/admin-dispatcher');
var paymentActions = require('./config.json').actions;

var actions = {
  updateUrl: function(path) {
    adminDispatcher.handleEvent({
      actionType: paymentActions.updateUrl,
      data: path
    });
  },

  flagAsDone: function(id) {
    adminDispatcher.handleEvent({
      actionType: paymentActions.flagAsDone,
      data: id
    });
  },

  retryFailedPayment: function(id) {
    adminDispatcher.handleEvent({
      actionType: paymentActions.retryFailedPayment,
      data: id
    });
  },

  filterByState: function(state) {
    adminDispatcher.handleEvent({
      actionType: paymentActions.filterByState,
      data: state
    });
  },

  reset: function() {
    adminDispatcher.handleEvent({
      actionType: paymentActions.reset
    });
  },

  validateField: function(fieldName, fieldValue) {
    adminDispatcher.handleEvent({
      actionType: paymentActions.validateField,
      data: {
        fieldName: fieldName,
        fieldValue: fieldValue
      }
    });
  },

  validateAddress: function(address) {
    adminDispatcher.handleEvent({
      actionType: paymentActions.validateAddress,
      data: address
    });
  },

  sendPaymentAttempt: function(payment) {
    adminDispatcher.handleEvent({
      actionType: paymentActions.sendPaymentAttempt,
      data: payment
    });
  },

  sendPaymentComplete: function(payment) {
    adminDispatcher.handleEvent({
      actionType: paymentActions.sendPaymentComplete,
      data: payment
    });
  },

  fetchNewRippleTransactions: function() {
    adminDispatcher.handleEvent({
      actionType: paymentActions.fetchNewRippleTransactions
    });
  },

  fetchRippleTransactions: function() {
    adminDispatcher.handleEvent({
      actionType: paymentActions.fetchRippleTransactions
    });
  }
};

module.exports = actions;
