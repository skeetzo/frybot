// season stuff
module.exports = function season(argument, message, sender, modifier) {
  var self = this;

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
    self.commands.bottle('duty');
    self.commands.scores('lvp');
   }
   this.commands.pregame = pregame;

  if (argument)
    this.commands.season[argument]();
  else
    self.say('Season?');
}