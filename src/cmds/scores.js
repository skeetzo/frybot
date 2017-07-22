var _ = require('underscore'),
    config = require('../config/index'),
    logger = config.logger,
    Sheets = require('../mods/sheets');

/**
* Scores command functions
*   add, undo
*
* Adds Player scores to the It Is What It Is scoresheet
*
* @param {string} argument - The argument to call
* @param {string} message - The message it's from
* @param {string} sender - The sender it's from
* @param {function} callback - the function used to post messages
*/
module.exports = function scores(data) {
  var self = this;
  var argument = data.argument, message = data.message, sender = data.sender, modifiers = data.modifiers;

  /*
    adds scores
  */
  function add() {
    Sheets.addScores(data.message,function(err) {
      if (err) logger.warn(err);
      self.say('Scores added!');
    });
  }
  this.commands.scores.add = add;

  /*
    called when booted for any necessary score updates
  */
  function boot() {
    if (!modifiers) modifiers = {};
    modifiers.quietly = true;
    update();
  }
  this.commands.scores.boot = boot;

  /*
    calls out everybody's scores
  */
  function callouts() {
    logger.log('Callouts incoming');
    _.forEach(self.league.getCurrentSeason().players,function (player) {
      streak(player);
    });
  };
  this.commands.scores.callouts = callouts;

  /*
    calls out the lowest valuable player
  */
  function lvp() {
    var leastValuablePlayer = 'Nico';
    _.forEach(self.league.getCurrentSeason().players, function (player) {
      if (leastValuablePlayer=='Nico')
        leastValuablePlayer = player;
      else if (player.mvp<leastValuablePlayer.mvp)
        leastValuablePlayer = player;
    });
    if (modifiers&&modifiers.text) return self.say(modifiers.text+leastValuablePlayer.toStats());
    self.say('Current LVP- '+leastValuablePlayer.toStats());
  }
  this.commands.scores.lvp = lvp;

  /*
    calls out the most valuable player
  */
  function mvp() {
    var mostValuablePlayer = 'Oberg';
    _.forEach(self.league.getCurrentSeason().players, function (player) {
      if (mostValuablePlayer=='Oberg')
        mostValuablePlayer = player;
      else if (player.mvp>mostValuablePlayer.mvp)
        mostValuablePlayer = player;
    });
    if (modifiers&&modifiers.get) return mostValuablePlayer;
    self.say(self,'Current MVP- '+mostValuablePlayer.toStats());
  }
  this.commands.scores.mvp = mvp;

  /*
    returns the scores of the desired player
  */
  function of() {
    _.forEach(self.league.getCurrentSeason().players, function (player) {
      if (message.indexOf(player.name)>-1)
        self.say(self,'Stats- '+player.toStats());
    });
  }
  this.commands.scores.of = of;

  /*
    Used in callouts to calculate win/loss streaks
  */
  function streak(player) {
    // forces player from string to obj
    if (typeof player != Object)
      _.forEach(self.league.getCurrentSeason().players, function (players) {
        if (typeof player != Object)
          if (players.name==player)
            player = players;
      });
    var matches = player.matches;
    var streak = '';
    var streakN = 0;
    for (i=0;i<matches.length;i++) {
      // to-do; could add in ways to track each individual hot streak
      if (matches[i][0]>matches[i][1]) {
        if (streak=='cold')
          streakN = 0;
        streak = 'hot';
        streakN++;
      }
      else {
        if (streak=='hot')
          streakN = 0;
        streak = 'cold';
        streakN++;
      }
    }
    var mod = '+';
    if (streak=='cold')
      mod = '-';
    if (streakN==1)
      streak = 'nothing special';
    else if (streakN==2) {
      if (streak=='cold')
        streak = 'chillin out';
      else
        streak = 'heating up';
    }
    else if (streakN==3) {
      if (streak=='cold')
        streak = 'ice cold';
      else
        streak = 'on fire';
    }
    else if (streakN>=5&&streakN<10) {
      if (streak=='cold')
        streak = 'falling asleep on the job';
      else
        streak = 'ablaze with glory';
    }
    else if (streakN>=10) {
      if (streak=='cold')
        streak = 'waking up in a dystopian future';
      else
        streak = 'selling their soul for victory';
    }
    else {
      if (streak=='cold')
        streak = 'dysfunctional';
      else
        streak = 'enh';
    }
    self.say(self,player.name+' is '+streak+' with ('+mod+streakN+')');
  }
  this.commands.scores.streak = streak;

  /*
    Updates from the scores available on the team spreadsheet
  */
  function update() {
    logger.log('Updating Players from Scoresheet');
    Sheets.updateScores(function(err, matchups) {
      if (err) logger.warn(err);
      self.league.getCurrentSeason().resetPlayers();
      self.league.getCurrentSeason().updateMatchups(matchups); // updates player data
      if (modifiers&&modifiers.quietly)
        logger.log('Season scores updated quietly');
      else if (modifiers&&modifiers.think)
        self.think('Season scores updated');
      else
        self.say('Season scores updated');
      self.commands.saveTeamShitData.call(self);
    });
  }
  this.commands.scores.update = update;

  if (this.commands.scores[argument])
    this.commands.scores[argument]();
  else
    this.say('What about the scores '+sender+'?');
}