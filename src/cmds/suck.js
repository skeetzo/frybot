
  /**
  * Suck command functions
  *   my, his
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
module.exports = function suck(argument, message, sender, modifier) {
  var self = this;

  function my() {
    if (sender.indexOf('Alex')>-1)
     return self.say('yeah suck'+sender+'\'s giant '+message+'!');
    if (sender=='Nico Mendoza'||sender=='Nico')
      self.say('yeah suck '+sender+'\'s tiny '+message+'!');
    else
      self.say('yeah suck '+sender+'\'s '+message+'!');
  }
  this.commands.suck.my = my;

  function his() {
    self.say('yeah suck his '+message+'! ');
    self.say('wait, what?');
  }
  this.commands.suck.his = his;

  if (this.commands.suck[argument])
    this.commands.suck[argument]();
  else
    self.say('What about sucking '+sender+'\'s '+message+'?');
}