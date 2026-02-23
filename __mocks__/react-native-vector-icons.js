const React = require('react');
const { Text } = require('react-native');

const Icon = ({ name, ...props }) => React.createElement(Text, props, name);

module.exports = Icon;
module.exports.default = Icon;
