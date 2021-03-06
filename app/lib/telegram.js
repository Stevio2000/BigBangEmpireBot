'use strict';

const numeral = require('numeral');
const TelegramBot = require('node-telegram-bot-api');

class BigBangEmpireTelegram {
  constructor(options, bbe) {
    this.bot = new TelegramBot(options.id, options.options);
    this.bbe = bbe;

    this.bbe.bot = this;

    this.froms = [];

    this.initRoutes();
  }

  initRoutes() {
    this.routeHelp();
    this.routeProfile();
    this.routeRestart();
    this.routeClose();
    this.routeCloseWhenNoEnergy();
  }

  handleReceiver(msg) {
    const newFrom = msg.from;
    const isMissing = this.froms.every((from) => from.id !== newFrom.id);

    if (isMissing) {
      this.froms.push(newFrom);
    }
  }

  broadcastMsg(msg) {
    this.froms.forEach((from) => {
      this.bot.sendMessage(from.id, msg);
    });
  }

  routeHelp() {
    this.bot.onText(/^\/help$/, (msg) => {
      this.handleReceiver(msg);
      const chatId = msg.chat.id;

      this.bot.sendMessage(chatId, `
From here you can control your Big Bang Empire Bot.

Commands are:

/help - View this help message

/profile - Print info about your hero
/restart - Restarts the game (if something bad happened)
/close - Shout down the game (enough?)
/closeWhenNoEnergy - Set to shut down when no energy
`);
    });
  }

  routeProfile() {
    this.bot.onText(/^\/profile$/, (msg) => {
      this.handleReceiver(msg);

      const chatId = msg.chat.id;
      const questCompletion = this.bbe.retrieveQuestCompletion();

      Promise.resolve()
        .then(() => {
          let message = `${this.bbe.userInfo.character.name}
- lvl ${this.bbe.userInfo.character.level} (${numeral(this.bbe.retrieveLevelPerc())
            .format('0%')}) (${this.bbe.rankLevel}°)
- ${numeral(this.bbe.userInfo.character.game_currency).format('$ 0,0')}
- ${this.bbe.userInfo.user.premium_currency} gems
- ${numeral(this.bbe.userInfo.character.honor).format('0,0')} honor (${this.bbe.rankHonor}°)
- ${numeral(this.bbe.userInfo.character.fans).format('0.00a')} fans (${this.bbe.rankFans}°)
--------------------
- energy: ${this.bbe.userInfo.character.quest_energy} + ${
          200 - this.bbe.userInfo.character.quest_energy_refill_amount_today} ${
            questCompletion ? `(${questCompletion})` : ''}
- stamina: ${this.bbe.userInfo.character.duel_stamina} / ${
            this.bbe.userInfo.character.max_duel_stamina} (${
              this.bbe.userInfo.character.duel_stamina_cost})`;

          if (this.bbe.userInfo.movie) {
            message += `
--------------------
- movie: ${numeral(this.bbe.userInfo.movie.energy / this.bbe.userInfo.movie.needed_energy)
              .format('0%')}
- movie energy: ${this.bbe.userInfo.character.movie_energy}`;
          }

          this.bot.sendMessage(chatId, message);
        });
    });
  }

  routeRestart() {
    this.bot.onText(/^\/restart$/, (msg) => {
      this.handleReceiver(msg);
      const chatId = msg.chat.id;

      this.bbe.restartGame();
      this.bot.sendMessage(chatId, 'Game restarted!');
    });
  }

  routeClose() {
    this.bot.onText(/^\/close$/, (msg) => {
      this.handleReceiver(msg);
      const chatId = msg.chat.id;

      this.bbe.closeGame();
      this.bot.sendMessage(chatId, 'Game close, cya!');
    });
  }

  routeCloseWhenNoEnergy() {
    this.bot.onText(/^\/closeWhenNoEnergy$/, (msg) => {
      this.handleReceiver(msg);
      const chatId = msg.chat.id;

      this.bbe.closeGameWhenNoEnergy();
      this.bot.sendMessage(chatId, 'Game will close when no energy, cya!');
    });
  }
}

module.exports = BigBangEmpireTelegram;

