"use strict";

var _ = require('lodash');
var React = require('react');
var Modal = require('react-bootstrap').Modal;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;
var Label = require('react-bootstrap').Label;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
var paymentActions = require('../actions');

var PaymentCreate = React.createClass({
  validationMap: {
    valid: 'success',
    invalid: 'warning'
  },

  refNameTypeMap: {
    address: 'string',
    unprocessed_address: 'string',
    amount: 'number',
    currency: 'string',
    destination_tag: 'number',
    source_tag: 'number',
    invoice_id: 'string',
    memos: 'string'
  },

  handleClose: function() {
    this.props.onSubmitSuccess();
  },

  formatInput: function(rawInputRef, type) {
    var formattedInput = rawInputRef.getValue().trim();

    if (!formattedInput) {
      return null;
    }

    return type === 'number' ? formattedInput * 1 : formattedInput;
  },

  buildFormObject: function(refKeys) {
    var _this = this;

    return _.mapValues(refKeys, function(value, key) {
      return _this.formatInput(_this.refs[key], _this.refNameTypeMap[key]);
    });
  },

  handleSubmit: function(e) {
    e.preventDefault();

    var payment = this.buildFormObject(this.refs);

    this.setState({
      disableForm: true,
      submitButtonLabel: 'Sending Payment...',
    });

    paymentActions.sendPaymentAttempt(payment);
  },

  handleSubmissionError: function() {
    this.setState({
      disableForm: false,
      submitButtonLabel: 'Re-Submit Payment?',
    });
  },

  setErrorMessage: function(fieldName, errorMessage) {
    var invalidField = {};

    invalidField[fieldName] = {
      inputState: 'invalid',
      errorMessage: errorMessage
    };

    this.setState(invalidField);
  },

  showFailedValidationResult: function(model, validationError) {
    var _this = this;

    this.handleSubmissionError();

    _.each(validationError, function(attribute) {
      var name = _.keys(attribute)[0];
      var firstErrorMessage = attribute[name][0];

      _this.setErrorMessage(name, firstErrorMessage);
    });
  },

  handleValidationResult: function(isValid, fieldName, errorMessage) {
    if (isValid) {
      var validField = {};

      validField[fieldName] = {inputState: 'valid'};

      this.setState(validField);
    } else {
      this.setErrorMessage(fieldName, errorMessage);
    }

    if (fieldName === 'unprocessed_address') {
      this.setState({
        disableAddressField: false,
        disableSubmitButton: false
      });
    }
  },

  validateField: function(fieldName) {
    var fieldValue = this.formatInput(this.refs[fieldName], this.refNameTypeMap[fieldName]);
    var clearFieldValidation = {};

    clearFieldValidation[fieldName] = {};

    this.setState(clearFieldValidation);

    if (fieldValue !== null) {
      paymentActions.validateField(fieldName, fieldValue);
    }
  },

  validateAddress: function() {
    var addressFieldValue = this.formatInput(this.refs.unprocessed_address, this.refNameTypeMap.unprocessed_address);

    this.setState({
      unprocessed_address: {}
    });

    if (addressFieldValue !== null) {
      this.setState({
        disableAddressField: true,
        disableSubmitButton: true
      });

      paymentActions.validateAddress(addressFieldValue);
    }
  },

  handleAddressProcessed: function(newAddressValue) {
    this.setState({
      addressValue: newAddressValue
    });
  },

  dispatchSendPaymentComplete: function(model, data) {
    this.hideForm();

    paymentActions.sendPaymentComplete(data.payment);
  },

  hideForm: function() {
    this.props.onRequestHide();
  },

  getInitialState: function() {
    return {
      addressValue: '',
      unprocessed_address: {},
      amount: {},
      currency: {},
      destination_tag: {},
      source_tag: {},
      invoice_id: {},
      memos: {},
      disableForm: false,
      submitButtonLabel: 'Submit Payment',
    };
  },

  componentDidMount: function() {
    this.props.model.on('invalid', this.showFailedValidationResult);
    this.props.model.on('validationComplete', this.handleValidationResult);
    this.props.model.on('sync', this.dispatchSendPaymentComplete);
    this.props.model.on('error', this.handleSubmissionError);
    this.props.model.on('addressProcessed', this.handleAddressProcessed);

    paymentActions.reset();
  },

  componentWillUnmount: function() {
    this.props.model.off('invalid validationComplete sync error addressProcessed');
  },

  render: function() {

    var requiredLabel = function(labelName) {
      return (
        <div>
          <Label bsStyle="info">Required</Label> {labelName}
        </div>
      );
    };

    var errorMessageLabel = function(errorMessage) {
      return (
        <Label bsStyle="warning">{errorMessage}</Label>
      );
    };

    return (
      <Modal
        title="Send Payment"
        backdrop={true}
        onRequestHide={this.hideForm}
        animation={false}
      >
        <div className="modal-body">
          <form onSubmit={this.handleSubmit}>
            <Input type="text" ref="unprocessed_address"
              label={requiredLabel("Destination Address: ")}
              bsStyle={this.validationMap[this.state.unprocessed_address.inputState]}
              disabled={this.state.disableForm || this.state.disableAddressField}
              onBlur={this.validateAddress.bind(this, false)}
              hasFeedback
              autoFocus={true}
            />
            {errorMessageLabel(this.state.unprocessed_address.errorMessage)}
            <Input type="hidden" ref="address" value={this.state.addressValue} />
            <Row>
              <Col xs={6}>
                <Input type="tel" ref="amount"
                  label={requiredLabel("Amount: ")}
                  bsStyle={this.validationMap[this.state.amount.inputState]}
                  disabled={this.state.disableForm} onBlur={this.validateField.bind(this, 'amount')}
                  hasFeedback
                />
                {errorMessageLabel(this.state.amount.errorMessage)}
              </Col>
              <Col xs={6}>
                <Input type="text" ref="currency"
                  label={requiredLabel("Currency: ")}
                  bsStyle={this.validationMap[this.state.currency.inputState]}
                  disabled={this.state.disableForm} onBlur={this.validateField.bind(this, 'currency')}
                  hasFeedback
                />
                {errorMessageLabel(this.state.currency.errorMessage)}
              </Col>
            </Row>
            <Row>
              <Col xs={6}>
                <Input type="tel" ref="destination_tag"
                  label="Destination Tag:"
                  bsStyle={this.validationMap[this.state.destination_tag.inputState]}
                  disabled={this.state.disableForm} onBlur={this.validateField.bind(this, 'destination_tag')}
                  hasFeedback
                />
                {errorMessageLabel(this.state.destination_tag.errorMessage)}
              </Col>
              <Col xs={6}>
                <Input type="tel" ref="source_tag"
                  label="Source Tag:"
                  bsStyle={this.validationMap[this.state.source_tag.inputState]}
                  disabled={this.state.disableForm} onBlur={this.validateField.bind(this, 'source_tag')}
                  hasFeedback
                />
                {errorMessageLabel(this.state.source_tag.errorMessage)}
              </Col>
            </Row>
            <Input type="text" ref="invoice_id"
              label="Invoice Id (SHA256):"
              bsStyle={this.validationMap[this.state.invoice_id.inputState]}
              disabled={this.state.disableForm} onBlur={this.validateField.bind(this, 'invoice_id')}
              hasFeedback
            />
            {errorMessageLabel(this.state.invoice_id.errorMessage)}
            <Input type="textarea" ref="memos"
              label="Memos:"
              bsStyle={this.validationMap[this.state.memos.inputState]}
              disabled={this.state.disableForm} onBlur={this.validateField.bind(this, 'memos')}
              hasFeedback
            />
            {errorMessageLabel(this.state.memos.errorMessage)}
            <Button className="pull-right" bsStyle="primary" bsSize="large" type="submit"
              disabled={this.state.disableForm || this.state.disableSubmitButton}
              block>
              {this.state.submitButtonLabel}
            </Button>
          </form>
        </div>
      </Modal>
    );
  }
});

module.exports = PaymentCreate;
