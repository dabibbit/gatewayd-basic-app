"use strict";

var React = require('react');

var ResizeSpan = React.createClass({
  getDefaultProps: function() {
    return {
      header: '',
      data: ''
    };
  },

  getInitialState: function() {
    return {
      showFull: false,
      showClass: ''
    };
  },

  toggleFullString: function(shouldShow) {
    var reverso = {
      false: ' show-full',
      true: ''
    };

    this.setState({
      showFull: (this.state.showFull ? false : true)
    });

    return reverso[shouldShow];
  },

  handleClick: function() {
    this.setState({
      showClass: this.toggleFullString(this.state.showFull)
    });
  },

  render: function() {
    return(
      <p className={"truncate" + this.state.showClass}>
        <span className="header" onClick={this.handleClick}>{this.props.header}</span>
        <span className="data" title={this.props.data}>{this.props.data}</span>
      </p>
    );
  }
});

module.exports = ResizeSpan;
