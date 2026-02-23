const React = require('react');
const { View } = require('react-native');

const Slider = (props) => React.createElement(View, { testID: 'slider', ...props });

module.exports = Slider;
module.exports.default = Slider;
