var _ = require('underscore');

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
module.exports = function bottle(argument, message, sender, modifier) {
  var self = this;

  // load bitches
  // loads from config.bottleBitches if supplied, will overwrite existing
  if (!self.bottleBitches||self.bottleBitches.length<=0) {
    self.bottleBitches = self.teamshitData.bottleBitches || [];
    if (self.bottleBitches.length<=0) {
      self.logger.debug('Populating Bottle Duty');
      var players = self.league.getCurrentSeason().players;
      if (!players||players.length<=0) {
        self.logger.warn('Unable to update Bottle Duty: missing Players');
        return;
      }
      _.forEach(players, function addTobottleBitches(player) {
        self.bottleBitches.push(player.name);
      });
      self.bottleBitches = shuffle(self.bottleBitches);
      self.saveTeamShitData();
    }
    else {
      self.logger.debug('Bottle Duty data found.');
      self.bottleBitches = self.teamshitData.bottleBitches;
    }
  }

  /*
    who's on duty
  */
  function duty() {
    self.say('Bottle Duty: '+self.bottleBitches[0]);
  }
  this.commands.bottle.duty = duty;

  /*
    moves bottle duty forward
  */
  function next() {
    var temp = self.teamshitData.bottleBitches.shift();
    self.teamshitData.bottleBitches.push(temp);
    self.saveTeamShitData();
    self.logger.debug('bottle duty updated');
  }
  this.commands.bottle.next = next;

  /*
    randomly decides a liquor
  */
  function what() {
    var bottles = ['malibu bitchass rum','women\'s vodka','jaeger and redbull','jaeger and redbull','jaeger and redbull','jack and coke','jack and coke','jack and coke, bitch'];
    self.say('Pick up some: '+bottles[Math.random(0,bottles.length)]);
  }
  this.commands.bottle.what = what;

  if (argument)
    this.commands.bottle[argument]();
  else
    this.say('Wtf about a bottle?');
}