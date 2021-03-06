"use strict";

var _ = require('lodash');
var $ = require('jquery');
var CryptoJS = require('crypto-js');

var Backbone = require('backbone');
var ValidationMixins = require('../../../shared/helpers/validation_mixin');

var adminDispatcher = require('../../../dispatchers/admin-dispatcher');
var sessionConfigActions = require('../config.json').actions;

var UserModel = require('../../../modules/users/models/user');

Backbone.$ = $;

var Session = Backbone.Model.extend({
  defaults: {
    gatewaydUrl: '',
    sessionKey: '',
    lastLogin: 0,
    credentials: 'ABC' // Base64
  },

  validationRules: {
    gatewaydUrl: {
      validators: ['isRequired', 'isString', 'minLength:4']
    },
    sessionKey: {
      validators: ['isRequired', 'isString', 'minLength:1']
    },
    credentials: {
      validators: ['isRequired', 'isString']
    }
  },

  initialize: function() {
    _.bindAll(this);

    this.set('userModel', new UserModel());

    adminDispatcher.register(this.dispatchCallback);
  },

  dispatchCallback: function(payload) {
    var handleAction = {};

    handleAction[sessionConfigActions.login] = this.login;
    handleAction[sessionConfigActions.logout] = this.logout;
    handleAction[sessionConfigActions.restore] = this.restore;

    if (!_.isUndefined(handleAction[payload.actionType])) {
      handleAction[payload.actionType](payload.data);
    }
  },

  updateSession: function(gatewaydUrl, sessionKey) {
    this.set({
      gatewaydUrl: gatewaydUrl,
      sessionKey: sessionKey,
      lastLogin: Date.now()
    });
  },

  createCredentials: function(name, sessionKey) {
    var encodedString = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(encodeURIComponent(name) + ':' + sessionKey));

    this.set('credentials', 'Basic ' + encodedString);
  },

  setUrl: function() {
    this.url = this.get('gatewaydUrl') + '/v1/users/login';
  },

  login: function(payload) {
    var _this = this;

    this.updateSession(payload.gatewaydUrl, payload.sessionKey);
    this.createCredentials(payload.name, payload.sessionKey);

    this.get('userModel').update(payload.name);

    this.set(payload);
    this.setUrl();

    this.save(null, {
      wait: true,
      contentType: 'application/json',
      data: JSON.stringify({
        name: this.get('userModel').get('name'),
        password: this.get('sessionKey')
      }),
      headers: {
        'Authorization': this.get('credentials')
      },
      success: function() {
        _this.get('userModel').set({isLoggedIn: true});
        sessionStorage.setItem('session', JSON.stringify(_this.toJSON()));
      }
    });
  },

  restore: function() {
    var oldSession, oldUser, restoredUser;

    if (sessionStorage.length === 0) {
      this.trigger('attemptRestore', {success: false, session: this});
      return;
    }

    oldSession = sessionStorage.getItem('session');

    this.set(JSON.parse(oldSession));
    oldUser = this.get('userModel');
    restoredUser = new UserModel(oldUser);
    this.set('userModel', restoredUser);

    this.trigger('attemptRestore', {success: true, session: this});
  },

  logout: function() {
    var resetUser;

    this.get('userModel').reset();
    resetUser = this.get('userModel');
    this.set('userModel', resetUser);

    this.set(this.defaults);

    sessionStorage.clear();
    this.trigger('logout', {session: this});
  },

  isLoggedIn: function() {
    return this.get('userModel').get('isLoggedIn');
  }
});

//add validation mixin
_.extend(Session.prototype, ValidationMixins);

module.exports = new Session();
