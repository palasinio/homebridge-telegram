'use strict';

const Bot = require('./Bot');
const QuietHandler = require('./QuietHandler');

let Characteristic;
let Service;


class BotAccessory {

  constructor(hap, log, config) {
    Characteristic = hap.Characteristic;
    Service = hap.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;

    this._notifications = config.notifications;

    this._bot = new Bot(this.name, config.token, config.chat, config.error);
    this._bot.on('connected', this._onBotConnected.bind(this));
    this._bot.on('failed', this._onBotFailed.bind(this));
    this._bot.connect();

    this._quietHandler = new QuietHandler(this._bot);

    this._services = this.createServices();
  }

  getServices() {
    return this._services;
  }

  createServices() {
    return [
      this.getAccessoryInformationService(),
      this.getBotService()
    ];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Telegram Bot')
      .setCharacteristic(Characteristic.SerialNumber, '42')
      .setCharacteristic(Characteristic.FirmwareRevision, this.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.version);
  }

  getBotService() {
    this._botService = new Service.TelegramBot(this.name);
    this._botService.setCharacteristic(Characteristic.StatusActive, false);

    const quietCharacteristic = this._botService.getCharacteristic(Characteristic.TelegramBotQuiet);
    if (typeof quietCharacteristic.onSet === 'function') {
      quietCharacteristic.onSet(this._setQuiet.bind(this));
    }
    else {
      quietCharacteristic.on('set', this._setQuiet.bind(this));
    }
    quietCharacteristic.updateValue(false);


    for (const name of Object.keys(this._notifications)) {
      const c = new Characteristic.SendCharacteristic(this.name, name, this._notifications[name], this._quietHandler);
      this._botService.addCharacteristic(c);
    }

    return this._botService;
  }

  identify(callback) {
    this.log(`Identify requested on telegram bot ${this.name}`);
    callback();
  }

  _setQuiet(quiet, callback) {
    this.log('Setting bot quiet state to ' + quiet);
    this._quietHandler.setQuiet(quiet);

    if (typeof callback === 'function') {
      callback();
    }
  }

  _onBotConnected() {
    this._setReachable(true);
  }

  _onBotFailed() {
    this._setReachable(false);
    setTimeout(() => {
      this._bot.connect();
    }, 1000);
  }

  _setReachable(reachable) {
    this._botService
      .getCharacteristic(Characteristic.StatusActive)
      .updateValue(reachable);
  }
}

module.exports = BotAccessory;
