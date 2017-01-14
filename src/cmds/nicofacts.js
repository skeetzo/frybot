var _ = require('underscore'),
    Spreadsheet = require('edit-google-spreadsheet');

module.exports = function nicofacts(data) {
  var self = this;
  var argument = data.argument, message = data.message, sender = data.sender, modifiers = data.modifiers;


  if (!this.nicofactsDB||this.nicofactsDB.length<=0) {
    self.logger.log('Loading Nico Facts');
    Spreadsheet.load({
      debug: true,
      spreadsheetId: self.config.Google_ItIsWhatItIs_Spreadsheet_ID,
      worksheetId: self.config.ItIsWhatItIs_nicofactsSheetID,
      oauth : self.config.Google_Oauth_Opts
    },
    function sheetReady(err, spreadsheet) {
      if(err) throw err;
      spreadsheet.receive(function(err, rows, info) {
        if(err) throw err;
        self.nicofactsDB = [];
        rows = _.toArray(rows);
        rows.shift();
        // console.log("rows: "+rows);
        _.forEach(rows, function(cols) {self.nicofactsDB.push('Nico Fact #'+cols[1]+': '+cols[2]);});
        self.logger.log('Nico Facts Loaded');
        self.commands.nicofacts.call(self,data);
        self.say('Uhhh what?');
      });
    });
    return;
  }  
  if (sender.indexOf('Nico')>=0) {
    self.say('What do you think you\'re doing, bitchass Nico?');
    return;
  }

  function spitNicoFact() {
    self.say(this.nicofactsDB[this.nicoFactCounter]);
    this.nicoFactCounter++;
    if (this.nicoFactCounter>this.nicofactsDB.length)
      this.nicoFactCounter=0;
  }
  this.commands.nicofacts.spitNicoFact = spitNicoFact;

  function startNicoFacts() {
    this.nicofactsDB = shuffle(this.nicofactsDB);
    spitNicoFact(); // unsure if this requires .call(self) and 2 lines below
    clearInterval(this.nicoFactTimer);
    this.nicoFactTimer = setInterval(spitNicoFact,120000); // 2 minutes
  }

  function FUCKOFF() {
    if (message!='PLEASE') {
      if (this.nicoFactCounter<10) {
        self.say('Invalid response. You have now been permanently subscribed to Nico Facts.');
        if (this.nicoFactPrimed) 
          startNicoFacts();
      }
      else
        self.say('Invalid response, motherfucker. Do you even Nico Fact?');
      return;
    }
    self.say('You have successfully unsubscribed from Nico Facts.');
    clearInterval(this.nicoFactTimer);
    this.nicoFactPrimed = false;
  }
  this.commands.nicofacts.FUCKOFF = FUCKOFF;

  function YES() {
    if (this.nicoFactCounter<=0) {
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
