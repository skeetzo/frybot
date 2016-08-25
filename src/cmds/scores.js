var _ = require('underscore'),
    Spreadsheet = require('edit-google-spreadsheet');

/**
* Scores command functions
*   add, undo
*
* Adds Player scores to the It Is What It Is scoresheet
*
* @param {string} argument - The argument to call
* @param {string} message - The message it's from
* @param {string} sender - The sender it's from
* @param {function} callback - the function used to post messages
*/
module.exports = function scores(argument, message, sender, modifier) {
  var self = this;

  /*
    adds scores
  */
  function add() {

    // Regex patterns used for parsing stat info
    //   only currently used in scores
    var statsRegex = new RegExp('([A-Za-z]+\\s*\\d{1}\\D*\\d{1})', "g"),
        nameRegex = '[A-Za-z]+',
        // scoreRegex = '\\d{1}\\D*\\d{1}$',
        pointsEarnedRegex = '\\d{1}',
        pointsGivenRegex = '\\d{1}$',
        dateDayRegex = '[\-]{1}([\\d]{2})[T]{1}',
        dateMonthRegex = '[\-]{1}([\\d]{2})[\-]{1}',
        dateYearRegex = '[\\d]{4}';

    Spreadsheet.load({
      debug: true,
      spreadsheetId: self.config.Google_ItIsWhatItIs_Spreadsheet_ID,
      worksheetId: self.config.ItIsWhatItIs_statsSheetID,
      oauth : self.config.Google_Oauth_Opts
    },
    function sheetReady(err, spreadsheet) {
      if(err) throw err;
      spreadsheet.receive(function(err, rows, info) {
        if(err) throw err;
        var matches = [],
            statResults = data.message.match(statsRegex);
        statResults.forEach(function (stat) {
          var match = '{"player":"","pointsEarned":"","pointsGiven":"","matchNumber":"","matchDate":""}';
          match = JSON.parse(match);
          // find name
          statsRegex = new RegExp(nameRegex);
          match.player = statsRegex.exec(stat);
          match.player = match.player[0];
          // find points earned
          statsRegex = new RegExp(pointsEarnedRegex);
          match.pointsEarned = statsRegex.exec(stat);
          match.pointsEarned = match.pointsEarned[0];
          // find points given
          statsRegex = new RegExp(pointsGivenRegex);
          match.pointsGiven = statsRegex.exec(stat);
          match.pointsGiven = match.pointsGiven[0];
          var timestamp = moment().format();
          var dateRegex = new RegExp(dateDayRegex);
          var day = dateRegex.exec(timestamp);
          day = day[1];
          dateRegex = new RegExp(dateMonthRegex);
          var month = dateRegex.exec(timestamp);
          month = month[1];
          dateRegex = new RegExp(dateYearRegex);
          var year = dateRegex.exec(timestamp);
          // last match number maintained automatically with overall last point of reference
          if (lastMatchNum_==5)
            lastMatchNum_ = 1;
          else
            lastMatchNum_++;
          match.matchNumber = lastMatchNum_;
          match.matchDate = month+'/'+day+'/'+year;
          var addedMatchJSONasString = '{ "1": "'+match.player+'", "2": "'+match.pointsEarned+'", "3":"'+match.pointsGiven+'", "4":"'+match.matchNumber+'", "5":"'+match.matchDate+'" }';                                    
          matches.push(addedMatchJSONasString);
        });
        // shifts each generated match into a row and added to the spreadsheet
        var endRow = info.lastRow+1+matches.length;
        for (i=info.lastRow+1;i<endRow;i++) {
          var jsonObj = "{\""+i+"\":"+matches.shift()+"}";
          jsonObj = JSON.parse(jsonObj);
          spreadsheet.add(jsonObj); // adds row one by one
        }
        spreadsheet.send(function(err) {
          if(err) self.logger.log(err);
            self.say('Scores added!');
        });
      });
    });
  }
  this.commands.scores.add = add;

  /*
    called when booted for any necessary score updates
  */
  function boot() {
    update(true);
  }
  this.commands.scores.boot = boot;

  /*
    calls out everybody's scores
  */
  function callouts() {
    self.logger.log('Callouts incoming');
    _.forEach(self.league.getCurrentSeason().players,function (player) {
      streak(player);
    });
  };
  this.commands.scores.callouts = callouts;

  /*
    calls out the lowest valuable player
  */
  function lvp() {
    var leastValuablePlayer = 'Nico';
    _.forEach(self.league.getCurrentSeason().players, function (player) {
      if (leastValuablePlayer=='Nico')
        leastValuablePlayer = player;
      else if (player.mvp<leastValuablePlayer.mvp)
        leastValuablePlayer = player;
    });
    self.say('Current LVP: '+leastValuablePlayer.toStats());
  }
  this.commands.scores.lvp = lvp;

  /*
    calls out the most valuable player
  */
  function mvp() {
    var mostValuablePlayer = 'Oberg';
    _.forEach(self.league.getCurrentSeason().players, function (player) {
      if (mostValuablePlayer=='Oberg')
        mostValuablePlayer = player;
      else if (player.mvp>mostValuablePlayer.mvp)
        mostValuablePlayer = player;
    });
    self.say(self,'Current MVP: '+mostValuablePlayer.toStats());
  }
  this.commands.scores.mvp = mvp;

  /*
    returns the scores of the desired player
  */
  function of() {
    _.forEach(self.league.getCurrentSeason().players, function (player) {
      if (message.indexOf(player.name)>-1)
        self.say(self,'Stats: '+player.toStats());
    });
  }
  this.commands.scores.of = of;

  /*
    Used in callouts to calculate win/loss streaks
  */
  function streak(player) {
    // forces player from string to obj
    if (typeof player != Object)
      _.forEach(self.league.getCurrentSeason().players, function (players) {
        if (typeof player != Object)
          if (players.name==player)
            player = players;
      });
    var matches = player.matches;
    var streak = '';
    var streakN = 0;
    for (i=0;i<matches.length;i++) {
      // to-do; could add in ways to track each individual hot streak
      if (matches[i][0]>matches[i][1]) {
        if (streak=='cold')
          streakN = 0;
        streak = 'hot';
        streakN++;
      }
      else {
        if (streak=='hot')
          streakN = 0;
        streak = 'cold';
        streakN++;
      }
    }
    var mod = '+';
    if (streak=='cold')
      mod = '-';
    if (streakN==1)
      streak = 'nothing special';
    else if (streakN==2) {
      if (streak=='cold')
        streak = 'chillin out';
      else
        streak = 'heating up';
    }
    else if (streakN==3) {
      if (streak=='cold')
        streak = 'ice cold';
      else
        streak = 'on fire';
    }
    else if (streakN>=5&&streakN<10) {
      if (streak=='cold')
        streak = 'falling asleep on the job';
      else
        streak = 'ablaze with glory';
    }
    else if (streakN>=10) {
      if (streak=='cold')
        streak = 'waking up in a dystopian future';
      else
        streak = 'selling their soul for victory';
    }
    else {
      if (streak=='cold')
        streak = 'dysfunctional';
      else
        streak = 'enh';
    }
    self.say(self,player.name+' is '+streak+' with ('+mod+streakN+')');
  }
  this.commands.scores.streak = streak;

  /*
    Updates from the scores available on the team spreadsheet
  */
  function update(quietly) {
    self.logger.log('Updating Players from Scoresheet');
    Spreadsheet.load({
      debug: false,
      spreadsheetId: self.config.Google_ItIsWhatItIs_Spreadsheet_ID,
      worksheetId: self.config.ItIsWhatItIs_statsSheetID,
      oauth : self.config.Google_Oauth_Opts
    },
    function sheetReady(err, spreadsheet) {
      if (err) {
        self.logger.warn(err);
        setTimeout(function() {
          self.logger.debug('retrying sheet load');
          update();
        },5000);
        throw err;
      }
      spreadsheet.receive(function(err, rows, info) {
        if(err) throw err;
        // header pickoff
        // var once = true;
        var keys = '{"name":"","pointsEarned":"","pointsGiven":"","matchNumber":"","matchDate":""}';
        var matches = [];
        _.forEach(rows, function(row) {
            var match = JSON.parse(keys);
            match.name = row[1];
            match.pointsEarned = row[2];
            match.pointsGiven = row[3];
            match.matchNumber = row[4];
            lastMatchNum_ = row[4]; // laziness
            match.matchDate = row[5];
            // console.log('match: '+JSON.stringify(match));
            match.players = [
              match.name,
              'Player Two' // todo: update when recording opponent names
            ];
            // todo: update when recording opponents sl & game scores, default implied
            // match.race = '2:2';
            // match.games = [];
            matches.push(match);
        });
        var matchups = [];
        matches.shift(); // header blanks
        while (matches.length>0) {
          var matchup = [];
          var j=0;
          for (j;j<5&&j<matches.length;j++) 
            matchup.push(matches[j]);
          matches.splice(0,j);
          matchups.push(matchup);
        }
        self.league.getCurrentSeason().resetPlayers();
        self.league.getCurrentSeason().updateMatchups(matchups); // updates player data
        if (quietly)
          self.logger.log('Season scores updated quietly');
        else
          self.say('Season scores updated');
        self.commands.saveTeamShitData.call(self);
      });
    });
  }
  this.commands.scores.update = update;

  if (argument)
    this.commands.scores[argument]();
  else
    this.say('What about the scores '+sender+'?');
}