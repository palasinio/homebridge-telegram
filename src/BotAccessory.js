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
    this._notificationStates = {};
    this._statusServices = [];

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
    const services = [this.getAccessoryInformationService(), this.getQuietService()];

    for (const notificationName of Object.keys(this._notifications)) {
      services.push(this.getNotificationService(notificationName));
    }

    return services;
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

  getQuietService() {
    this._quietService = new Service.Switch(`${this.name} Quiet`, 'quiet');
    this._quietService.addOptionalCharacteristic(Characteristic.StatusActive);
    this._quietService
      .setCharacteristic(Characteristic.Name, 'Quiet')
      .setCharacteristic(Characteristic.StatusActive, false);

    const quietCharacteristic = this._quietService.getCharacteristic(Characteristic.On);
    if (typeof quietCharacteristic.onSet === 'function') {
      quietCharacteristic.onSet(this._setQuiet.bind(this));
    }
    else {
      quietCharacteristic.on('set', this._setQuiet.bind(this));
    }
    quietCharacteristic.updateValue(false);

    this._statusServices.push(this._quietService);

    return this._quietService;
  }

  getNotificationService(notificationName) {
    const service = new Service.Switch(notificationName, `notification-${notificationName}`);
    service.addOptionalCharacteristic(Characteristic.StatusActive);
    service
      .setCharacteristic(Characteristic.Name, notificationName)
      .setCharacteristic(Characteristic.StatusActive, false);

    this._notificationStates[notificationName] = this._createNotificationState(this._notifications[notificationName]);

    const onCharacteristic = service.getCharacteristic(Characteristic.On);
    if (typeof onCharacteristic.onSet === 'function') {
      onCharacteristic.onSet(value => this._handleNotificationSet(notificationName, value));
    }
    else {
      onCharacteristic.on('set', (value, callback) => this._handleNotificationSet(notificationName, value, callback));
    }
    onCharacteristic.updateValue(false);

    this._statusServices.push(service);

    return service;
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
    for (const service of this._statusServices) {
      service
        .getCharacteristic(Characteristic.StatusActive)
        .updateValue(reachable);
    }
  }

  _createNotificationState(notificationConfig) {
    let mode;
    let randomize;
    let messages;

    if (notificationConfig instanceof Array) {
      mode = undefined;
      randomize = true;
      messages = notificationConfig;
    }
    else {
      mode = notificationConfig.mode;
      randomize = Object.prototype.hasOwnProperty.call(notificationConfig, 'randomize') ? notificationConfig.randomize : true;
      messages = notificationConfig.messages;
    }

    if (['Markdown', 'HTML', undefined].indexOf(mode) === -1) {
      throw new Error('Invalid notification configuration. Please check your configuration of homebridge-telegram.');
    }
    if (!(messages instanceof Array) || messages.length === 0) {
      throw new Error('Must specify at least one message for telegram notifications.');
    }

    return {
      mode: mode,
      randomize: randomize,
      messages: messages.slice(),
      activeMessages: messages.slice()
    };
  }

  _handleNotificationSet(notificationName, value, callback) {
    const complete = typeof callback === 'function' ? callback : (() => {});

    if (!value) {
      complete();
      return Promise.resolve();
    }

    const notificationState = this._notificationStates[notificationName];
    const service = this._statusServices.find(currentService => currentService.getCharacteristic(Characteristic.Name).value === notificationName);

    return this._pickMessage(notificationState)
      .then(message => {
        return this._quietHandler.send(message, notificationState.mode);
      })
      .then(() => {
        complete();
      })
      .catch(error => {
        complete(error);
        throw error;
      })
      .finally(() => {
        setTimeout(() => {
          service.getCharacteristic(Characteristic.On).updateValue(false);
        }, 1000);
      });
  }

  _pickMessage(notificationState) {
    return new Promise((resolve, reject) => {
      try {
        const notificationIndex = this._getMessageIndex(notificationState);
        const notification = notificationState.activeMessages[notificationIndex];
        notificationState.activeMessages.splice(notificationIndex, 1);

        if (notificationState.activeMessages.length === 0) {
          notificationState.activeMessages = notificationState.messages.slice();
        }

        resolve(notification);
      }
      catch (error) {
        reject(error);
      }
    });
  }

  _getMessageIndex(notificationState) {
    if (!notificationState.randomize) {
      return 0;
    }

    return Math.floor(Math.random() * notificationState.activeMessages.length);
  }
}

module.exports = BotAccessory;
