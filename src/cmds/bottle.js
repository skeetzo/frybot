var _ = require('underscore'),
    config = require('../config/index'),
    logger = config.logger;

/**
* Bottle command functions
*  who, what
*
* Tells the group who/what is responsible for booze
*
* @param {string} argument - The argument to call
* @param {string} message - The message it's from
* @param {string} sender - The sender it's from
* @param {function} callback - the function used to post messages
*/
module.exports = function bottle(data) {
  var self = this;
  var argument = data.argument, message = data.message, sender = data.sender, modifiers = data.modifiers;

  // load bitches
  // loads from config.bottleBitches if supplied, will overwrite existing
  if (!self.bottleBitches||self.bottleBitches.length<=0) {
    self.bottleBitches = self.teamshitData.bottleBitches || [];
    if (self.bottleBitches.length<=0) {
      logger.debug('Populating Bottle Duty');
      var players = self.league.getCurrentSeason().players;
      if (!players||players.length<=0) {
        logger.warn('Unable to update Bottle Duty: missing Players');
        return;
      }
      _.forEach(players, function addTobottleBitches(player) {
        if (player.name=='Coco') return; // Legacy privelages
        self.bottleBitches.push(player.name);
      });
      self.bottleBitches = shuffle(self.bottleBitches);
      self.commands.saveTeamShitData.call(self);
    }
    else {
      logger.debug('Bottle Duty data found.');
      self.bottleBitches = self.teamshitData.bottleBitches;
    }
  }

  /*
    who's on duty
  */
  function duty() {
    if (modifiers&&modifiers.text) return self.say.call(self,modifiers.text+self.bottleBitches[0]);
    self.say.call(self,'Bottle Duty: '+self.bottleBitches[0]);
  }
  this.commands.bottle.duty = duty;

  /*
    moves bottle duty forward
  */
  function next() {
    var temp = self.teamshitData.bottleBitches.shift();
    self.teamshitData.bottleBitches.push(temp);
    self.commands.saveTeamShitData.call(self);
    logger.debug('bottle duty updated');
  }
  this.commands.bottle.next = next;

  /*
    random player
  */
  function random() {
    var players = self.league.getCurrentSeason().players,
        player = players[Math.floor(Math.random()*players.length)];
    self.say.call(self,'Bottle Duty: '+player.name);
  }
  this.commands.bottle.random = random;

  /*
    randomly decides a liquor
  */
  function what() {
    var bottles = ['malibu bitchass rum','women\'s vodka','jaeger and redbull','jaeger and redbull','jaeger and redbull','jack and coke','jack and coke','jack and coke, bitch'];
    self.say.call(self,'Pick up some: '+bottles[Math.floor(Math.random()*bottles.length)]);
  }
  this.commands.bottle.what = what;

  if (this.commands.bottle[argument])
    this.commands.bottle[argument]();
  else
    this.say('Wtf about a bottle?');
}


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}
