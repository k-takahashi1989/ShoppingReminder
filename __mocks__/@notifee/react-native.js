const notifee = {
  createChannel: jest.fn().mockResolvedValue('channel-id'),
  displayNotification: jest.fn().mockResolvedValue(undefined),
  onForegroundEvent: jest.fn(() => jest.fn()),
  onBackgroundEvent: jest.fn(),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
  getInitialNotification: jest.fn().mockResolvedValue(null),
};

module.exports = notifee;
module.exports.default = notifee;
module.exports.AndroidImportance = { HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 };
module.exports.AndroidStyle = { BIGTEXT: 0, INBOX: 1, BIGPICTURE: 2 };
module.exports.EventType = { PRESS: 1, ACTION_PRESS: 2, DISMISSED: 5 };
