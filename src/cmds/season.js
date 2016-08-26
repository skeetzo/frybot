var _ = require('underscore');

// season stuff
module.exports = function season(data) {
  var self = this;
  var argument = data.argument, message = data.message, sender = data.sender, modifiers = data.modifiers;

  function afterparty() {
    self.say('...Syncing Yesterday\'s Game Results...');
    self.commands.scores.call(self,{argument:'update'})
    self.commands.bottle.call(self,{argument:'next'});
    self.commands.bottle.call(self,{argument:'duty',modifiers:{text:'Next Week\'s Bottle Duty- '}});
  }
  this.commands.season.afterparty = afterparty;

  function fresh() {
    self.say('Creating New Season: '+message);
    self.league.fresh({label:message},function(err) {
      if (err) return err;
      return self.say("Season Created");  
    }); 
  }
  this.commands.season.fresh = fresh;

  function pregame() {   
    var maybes = ['It\'s League night bitch niggas!','It\'s League night meatbags!'];
    self.say(maybes[Math.floor(Math.random()*maybes.length)]);
    self.say('Playing @ '+self.league.getCurrentSeason().getTodaysMatchup().location);
    self.commands.bottle.call(self,{argument:'next'});
    self.commands.bottle.call(self,{argument:'duty'});
    self.commands.scores.call(self,{argument:'lvp'});
  }
  this.commands.season.pregame = pregame;

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