
module.exports = function fuck(data) {
  var self = this;
  var argument = data.argument, message = data.message, sender = data.sender, modifiers = data.modifiers;

  function you() {
    if (message==='frybot'||message==='Frybot') {
      self.say('Fuck you '+sender+'!');
      return;
    }
    self.say('Yeah fuck you '+message+'!');
  }
  this.commands.fuck.you = you;

  function me() {
    if (!message||(message!='Frybot'&&message!='frybot'))
      self.say('I think I\'ll pass..');
    else
      self.say('Yeah fuck him '+message+'!');
  }
  this.commands.fuck.me = me;

  function off() {
    if (message==='Frybot'||message==='frybot')
      self.say('No you fuck off '+sender+'!');
    else
      self.say('Yeah fuck off '+sender+'!');
  }
  this.commands.fuck.off = off;

  if (this.commands.fuck[argument])
    this.commands.fuck[argument]();
  else
    self.say('Fuck off '+sender+'?');
}