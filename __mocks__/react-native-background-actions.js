let running = false;

const BackgroundService = {
  start: jest.fn().mockImplementation(async () => { running = true; }),
  stop: jest.fn().mockImplementation(async () => { running = false; }),
  isRunning: jest.fn().mockImplementation(() => running),
  updateNotification: jest.fn().mockResolvedValue(undefined),
};

module.exports = BackgroundService;
module.exports.default = BackgroundService;
