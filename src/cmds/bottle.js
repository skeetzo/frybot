var _ = require('underscore'),
    config = require('../config/index'),
    BottleDuty = require('../models/bottleduty'),
    logger = config.logger;

var bottleDuty = false;
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

  if (!bottleDuty) {
    BottleDuty.findOne({},function (err, bottleDuty_) {
      if (err) logger.warn(err);
      if (!bottleDuty_||bottleDuty_.length==0) {
        bottleDuty = new BottleDuty({'players':self.team.players});
        bottleDuty.save(function(err) {
          if (err) logger.warn(err);
          process();
        })
      } else {
        bottleDuty = bottleDuty_;
        process();
      }
    });
  }

  /*
    who's on duty
  */
  function duty() {
    // BottleDuty.findOne({},function(err, bottleDuty) {
      // if (err) return logger.warn(err);
      if (modifiers&&modifiers.text) return self.say.call(self,modifiers.text+bottleDuty.getDuty());
      self.say.call(self,'Bottle Duty: '+bottleDuty.getDuty());
    // });
  }
  this.commands.bottle.duty = duty;

  /*
    random player
  */
  function random() {
    // BottleDuty.findOne({},function(err, bottleDuty) {
      // if (err) return logger.warn(err);
      self.say.call(self,'Bottle Duty: '+bottleDuty.getRandomDuty());
    // });
  }
  this.commands.bottle.random = random;

  /*
    randomly decides a liquor
  */
  function what() {
    // BottleDuty.findOne({},function(err, bottleDuty) {
      // if (err) return logger.warn(err);
      self.say.call(self,'Pick up some: '+bottleDuty.getBottle());
    // });
  }
  this.commands.bottle.what = what;

  function process() {
    if (self.commands.bottle[argument])
      self.commands.bottle[argument]();
    else
      self.say('Wtf about a bottle?');
  }
}
