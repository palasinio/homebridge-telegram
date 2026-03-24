'use strict';

const BotAccessory = require('./BotAccessory');

const platformName = 'homebridge-telegram';
const platformPrettyName = 'Telegram';

module.exports = (homebridge) => {
  homebridge.registerPlatform(platformName, platformPrettyName, TelegramPlatform, true);
};

const TelegramPlatform = class {
  constructor(log, config, api) {
    this.log = log;
    this.log('TelegramPlatform Plugin Loaded');
    this.config = config;
    this.api = api;
  }

  accessories(callback) {
    let _accessories = [];
    const { bots } = this.config;

    bots.forEach(bot => {
      this.log(`Found bot in config: "${bot.name}"`);

      const botAccessory = new BotAccessory(this.api.hap, this.log, bot);
      _accessories.push(botAccessory);
    });

    callback(_accessories);
  }
};
