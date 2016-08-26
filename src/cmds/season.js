// season stuff
module.exports = function season(data) {
  var self = this;
  var argument = data.argument, message = data.message, sender = data.sender, modifiers = data.modifiers;

  function afterParty() {
    self.commands.activate(update,function(err, message) {
          if (err) return self.logger.error(err);
          self.say(message);
        });
        self.commands.activate({command:'bottle',argument:'next'},function(err, message) {
          if (err) return self.logger.error(err);
          self.say(message);
        });
  }
  this.commands.season.afterParty = afterParty;

  function fresh() {
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
    self.commands.bottle.call(self,{argument:'lvp'});
  }
  this.commands.season.pregame = pregame;

  function preseason() {
    self.say('Start getting ready bitches, the new season is starting next week!');
    var lvp = JSON.parse(self.commands.scores.call(self,{argument:'lvp',modifiers:{get:true}}));
    self.say('Looking at you '+lvp.name+', the least valuable player.');
  }
  this.commands.season.preseason = preseason;

  if (this.commands.season[argument])
    this.commands.season[argument]();
  else
    self.say('Season?');
}