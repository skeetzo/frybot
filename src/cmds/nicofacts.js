var _ = require('underscore'),
    Spreadsheet = require('edit-google-spreadsheet');

module.exports = function nicofacts(argument, message, sender, callback) {
  var self = this;
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
        self.commands.nicofacts(argument, message, sender);
        self.say('Uhhh what?');
      });
    });
    return;
  }  
  if (sender.indexOf('Nico')>=0) {
    self.say('What do you think you\'re doing, bitchass Nico?');
    return;
  }

  var spitNicoFact = function() {
    self.say(this.nicofactsDB[this.nicoFactCounter]);
    this.nicoFactCounter++;
    if (this.nicoFactCounter>this.nicofactsDB.length)
      this.nicoFactCounter=0;
  }

  function startNicoFacts() {
    this.nicofactsDB = shuffle(this.nicofactsDB);
    spitNicoFact();
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
  this.commands.FUCKOFF = FUCKOFF;

  function YES() {
    if (this.nicoFactCounter<=0) {
      self.say('You have now been subscribed to Nico Facts.');
      startNicoFacts();
    }
    else
      self.say('You are all already subscribed to Nico Facts, bitchass '+sender+'...');
  }
  this.commands.YES = YES;

  function NO() {
    self.say('Nico Fact #846: No one tells Nico Facts when to stop.');
  }
  this.commands.NO = NO;

  function START() {
    self.say('Nico Fact #847: No one tells Nico Facts what to do.');
  }
  this.commands.START = START;

  if (argument)
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