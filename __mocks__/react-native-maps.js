const React = require('react');

const MapView = ({ children, ...props }) => React.createElement('MapView', props, children);
MapView.Animated = MapView;
const Marker = (props) => React.createElement('Marker', props);
const Circle = (props) => React.createElement('Circle', props);
const Polyline = (props) => React.createElement('Polyline', props);
const Polygon = (props) => React.createElement('Polygon', props);

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
module.exports.Circle = Circle;
module.exports.Polyline = Polyline;
module.exports.Polygon = Polygon;
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.PROVIDER_DEFAULT = null;
