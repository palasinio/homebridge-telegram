'use strict';

const EventEmitter = require('events');
const debug = require('debug')('Bot');

const BotFather = require('botfather');

class Bot extends EventEmitter {
  constructor(name, token, chatId, error) {
    super();

    this.name = name;
    this._chatId = chatId;
    this._error = error;

    this.status = 'disconnected';
    this._telegramBot = new BotFather(token);
  }

  connect() {
    if (this.status !== 'disconnected' && this.status !== 'failed') {
      throw new Error('Not disconnected.');
    }

    this._call('getMe')
      .then(bot => {
        debug('[%s] I am @%s, right? :)', this.name, bot.username);
      })
      .then(() => {
        this._setStatus('connected');
      })
      .catch(e => {
        debug('[%s] Failed to retrieve bot data from telegram. %o', this.name, e);
      });
  }

  send(message, mode) {
    const options = {
      chat_id: this._chatId,
      text: message
    };

    if (mode !== undefined) {
      options.parse_mode = mode;
    }

    return this._call('sendMessage', options)
      .catch(e => {
        debug('[%s] Failed to send error notification to Telegram. Error: %o', this.name, e);
      });
  }

  _call(method, parameters) {
    return this._telegramBot.api(method, parameters)
      .then(json => {
        if (json.ok) {
          return json.result;
        }

        debug('[%s] Error calling %s - %s', this.name, method, json.description);
        this._setStatus('failed');
        throw new Error(json.description);
      });
  }

  _setStatus(status) {
    if (this.status !== status) {
      this.status = status;
      this.emit(status);

      if (status === 'failed') {
        this.send(this._error);
      }
    }
  }
}

module.exports = Bot;
