const React = require('react');
const { View, TextInput } = require('react-native');

const GooglePlacesAutocomplete = (props) =>
  React.createElement(View, null,
    React.createElement(TextInput, {
      testID: 'places-autocomplete-input',
      placeholder: props.placeholder,
    })
  );

module.exports = { GooglePlacesAutocomplete };
module.exports.default = GooglePlacesAutocomplete;
