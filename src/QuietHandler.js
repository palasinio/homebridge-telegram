'use strict';

class QuietHandler {
  constructor(bot) {
    this._bot = bot;
    this._quiet = false;
  }

  setQuiet(quiet) {
    this._quiet = quiet;
  }

  send(message, mode) {
    if (this._quiet === false) {
      return this._bot.send(message, mode);
    }

    return Promise.resolve();
  }
}

module.exports = QuietHandler;
