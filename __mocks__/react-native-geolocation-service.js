const Geolocation = {
  getCurrentPosition: jest.fn((success) =>
    success({ coords: { latitude: 35.6812, longitude: 139.7671, accuracy: 10 } })
  ),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn().mockResolvedValue('granted'),
};

module.exports = Geolocation;
module.exports.default = Geolocation;
