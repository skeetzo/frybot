var _ = require('underscore'),
    config = require('../config/index'),
    logger = config.logger,
    NicoFact = require('../models/nicofact'),
    Sheets = require('../mods/sheets');

module.exports = function nicofacts(data) {
  var self = this;
  var argument = data.argument, message = data.message, sender = data.sender, modifiers = data.modifiers;

  if (sender&&sender.indexOf('Nico')>=0) {
    self.say('What do you think you\'re doing, bitchass Nico?');
    return;
  }

  function addNicoFact() {
    // parse for the fact
    logger.debug('Adding Nico Fact');
    var number = message.match(/([0-9]*):/gi)[0];
    number = number.toString().substring(0,number.toString().length-1);
    // logger.debug('number: %s',number);
    var newFact = message.substring(message.indexOf(':')+1).trim();
    // while (newFact.charAt(0)==' ') newFact = newFact.substring(1);
    // logger.debug('newFact: %s',newFact);
    logger.debug('Nico Fact #%s: %s',number,newFact);
    // add to spreadsheet
    Sheets.addNicoFact({'fact':newFact,'number':number},function(err) {
      if (err) return logger.warn(err);
      logger.log('Nico Fact Added');
    });
    var newFact_ = {
      'fact': newFact,
      'number': number,
      'author': sender
    }
    newFact_ = new NicoFact(newFact_);
    newFact_.save(function(err) {
      if (err) logger.warn(err);
    });
  }
  this.commands.addNicoFact = addNicoFact;

  function spitNicoFact() {
    console.log('spitting nico fact');
    NicoFact.find({},function(err, nicoFacts) {
      if (err) return logger.warn(err);
      if (!nicoFacts||nicoFacts.length==0) return logger.warn('Missing Nico Facts');
      var random = Math.floor(Math.random() * nicoFacts.length);
      self.say(nicoFacts[random].getFact());
      nicoFacts[random].echoed++;
      self.nicoFactCounter++;
      if (self.nicoFactCounter>nicoFacts.length)
        self.nicoFactCounter=0;
      nicoFacts[random].save(function(err) {
        if (err) logger.warn(err);
      });
    });
    
  }
  this.commands.nicofacts.spitNicoFact = spitNicoFact;

  function startNicoFacts() {
    spitNicoFact(); // unsure if this requires .call(self) and 2 lines below
    clearInterval(self.nicoFactTimer);
    self.nicoFactTimer = setInterval(spitNicoFact,120000); // 2 minutes
  }

  function FUCKOFF() {
    if (message!='PLEASE') {
      if (self.nicoFactCounter<10) {
        self.say('Invalid response. You have now been permanently subscribed to Nico Facts.');
        if (self.nicoFactPrimed) 
          startNicoFacts();
      }
      else
        self.say('Invalid response, motherfucker. Do you even Nico Fact?');
      return;
    }
    self.say('You have successfully unsubscribed from Nico Facts.');
    clearInterval(self.nicoFactTimer);
    self.nicoFactPrimed = false;
  }
  this.commands.nicofacts.FUCKOFF = FUCKOFF;

  function YES() {
    if (self.nicoFactCounter<=0) {
      self.say('You have now been subscribed to Nico Facts.');
      startNicoFacts();
    }
    else
      self.say('You are all already subscribed to Nico Facts, bitchass '+sender+'...');
  }
  this.commands.nicofacts.YES = YES;

  function NO() {
    self.say('Nico Fact #846: No one tells Nico Facts when to stop.');
  }
  this.commands.nicofacts.NO = NO;

  function START() {
    self.say('Nico Fact #847: No one tells Nico Facts what to do.');
  }
  this.commands.nicofacts.START = START;

  function tweetnicofact() {
    NicoFact.find({},function(err, nicoFacts) {
      if (err) return logger.warn(err);
      if (!nicoFacts||nicoFacts.length==0) return logger.warn('Missing Nico Facts');
      var random = Math.floor(Math.random() * nicoFacts.length);
      var randomNicoFact = nicoFacts[random];
      logger.log('Tweeting Random Nico Fact: %s',randomNicoFact);
      self.twitter.tweet.call(self,randomNicoFact.getFact());
      randomNicoFact.echoed++;
      randomNicoFact.save(function(err) {
        if (err) logger.warn(err);
      });
    });
  }
  this.commands.tweetnicofact = tweetnicofact;

  // console.log('argument: %s',argument);

  if (argument=='addNicoFact') {
    addNicoFact();
    return;
  }
  else if (argument=="tweetnicofact") {
    tweetnicofact();
    return;
  }


  if (this.commands.nicofacts[argument])
    this.commands.nicofacts[argument]();
  else if (!argument&&!this.nicoFactPrimed) {
    this.nicoFactPrimed = true;
    this.nicoFactCounter = 0;
    self.say('Reply \'/nicofacts YES\' to subscribe to Nico Facts for a weekly charge of 1 Jäger Bomb. Standard msg and data rates will apply. You can cancel at anytime by replying \'/nicofacts FUCKOFF\'');
  }
  else {
    self.say('Invalid response.');
    this.commands.nicofacts.YES();
  }
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
