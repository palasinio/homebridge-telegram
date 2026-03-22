'use strict';

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;
    const Service = hap.Service;

    class TelegramBotQuiet extends Characteristic {
      constructor() {
        super('Quiet', TelegramBotQuiet.UUID);

        this.setProps({
          format: Characteristic.Formats.BOOL,
          perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
        });

        this.value = this.getDefaultValue();
      }
    }
    TelegramBotQuiet.UUID = '9799244D-7E74-471F-B672-C41C262F7337';
    Characteristic.TelegramBotQuiet = TelegramBotQuiet;

    class TelegramBot extends Service {
      constructor(displayName, subtype) {
        super(displayName, TelegramBot.UUID, subtype);

        // Required Characteristics
        this.addCharacteristic(Characteristic.TelegramBotQuiet);

        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.Name);
        this.addOptionalCharacteristic(Characteristic.StatusActive);
      }
    }
    TelegramBot.UUID = 'CA1172BF-8FB8-4F26-98E9-71EE92F7AF63';
    Service.TelegramBot = TelegramBot;
  }
};
