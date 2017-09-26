var _ = require('underscore'),
    config = require('../config/index'),
    Season = require('../models/season'),
    logger = config.logger;

// season stuff
module.exports = function season(data) {
  var self = this;
  var argument = data.argument, message = data.message, sender = data.sender, modifiers = data.modifiers;

  function afterparty() {
    self.think('...Syncing Yesterday\'s Game Results...');
    self.commands.scores.call(self,{argument:'update',modifiers:{think:true}});
    self.commands.bottle.call(self,{argument:'next'});
    self.commands.bottle.call(self,{argument:'duty',modifiers:{text:'Next Week\'s Bottle Duty- '}});
    self.commands.scores.call(self,{argument:'callouts'});
  }
  this.commands.season.afterparty = afterparty;

  function checkin() {
    self.think('...Beginning Check In...');
    // message about checking in
    // track who likes the message


  }

  function fresh() {
    self.say('Creating New Season: '+message);
    // self.league.fresh({label:message},function(err) {
      // if (err) return err;
      self.say("Season Created");  
      // self.commands.saveTeamShitData.call(self);
    // }); 
  }
  this.commands.season.fresh = fresh;

  function pregame() {   
    Season.getTodaysMatchup(function(err, matchup) {
      if (err) return logger.warn(err);      
      var maybes = ['bitch niggas','meatbags','homos','losers','dolts','morons','dirtbags','noobs','scrubs','ladies'];
      self.say('It\'s League night '+maybes[Math.floor(Math.random()*maybes.length)]+'!');
      self.say('Playing @ '+matchup.location);
      self.commands.bottle.call(self,{argument:'next'});
      self.commands.bottle.call(self,{argument:'duty'});
      self.commands.scores.call(self,{argument:'lvp'});
    });
  }
  this.commands.season.pregame = pregame;

  function match() {
    self.say('Good luck tonight bitches! League is starting in 10 minutes.');
  }
  this.commands.season.match = match;

  function newseason() {
    self.say('Start getting ready bitches, the new season is starting next week!');
    self.commands.scores.call(self,{argument:'lvp',modifiers:{text:'Try to suck less this time around '}});
  }
  this.commands.season.newseason = newseason;

  if (this.commands.season[argument])
    this.commands.season[argument]();
  else
    self.say('Season?');
}