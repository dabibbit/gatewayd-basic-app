"use strict";

var _ = require('lodash');
var React = require('react');

var Chevron = React.createClass({
  propTypes: {
    clickHandler: React.PropTypes.func,
    iconClasses: React.PropTypes.string
  },

  iconMap: {
    up: 'glyphicon glyphicon-chevron-up',
    down: 'glyphicon glyphicon-chevron-down'
  },

  reversal: {
    up: 'down',
    down: 'up'
  },

  handleClick: function() {
    this.setState({
      direction: this.reversal[this.state.direction]
    });

    this.props.clickHandler();
  },

  getInitialState: function() {
    return {
      direction: 'down'
    };
  },

  render: function() {
    var _this = this;
    var classBuilder = function() {
      if (_.isEmpty(_this.props.iconClasses)) {
        return iconMap[_this.state.direction];
      }

      return _this.props.iconClasses + ' ' + _this.iconMap[_this.state.direction];
    };

    return (
      <span
        className={classBuilder()}
        onClick={this.handleClick}
      />
    );
  }
});

module.exports = Chevron;
