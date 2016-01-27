var say = require('./bot.js').say;
var config = require('./config.js');
var cache = require('./cache.js');
var GroupMe_API = require('groupme').Stateless;
var Player = require('./league.js').Player;
var Spreadsheet = require('edit-google-spreadsheet');
var _ = require('underscore');


// bot = new bot();
var self;

var commands = (function() {
  var confirmedCommand;
  self = this;

  /**
  * Bottle command functions
  *  who, what
  *
  * Tells the group who/what is responsible for booze
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  function bottle(argument, message, sender) {
    bottle.duty = function () {
      Spreadsheet.load({
        debug: true,
        spreadsheetId: config.ItIsWhatItIs_Spreadsheet_ID,
        worksheetId: config.ItIsWhatItIs_frybotSheetID,
        oauth : {
          email: config.Frybot_Google_ServiceEmail,
          key: config.Frybot_Google_key
        }
      },
      function sheetReady(err, spreadsheet) {
        if(err) throw err;
        spreadsheet.receive(function(err, rows, info) {
          if(err) throw err;
          var players = [];
          rows = _.toArray(rows);
          rows.shift();
          console.log("rows: "+rows);
          _.forEach(rows, function(col) {
            players.push(col[1]);
          });
          var person = players[0];
          players.push(players.shift());
          for (var row = 2;row < players.length+2;row++) {
            var front = "{\""+row+"\": { ";
            var tail = "} }";
            var middle = "";
            if (row==players.length)
              middle += "\"1\": \""+players[row-2]+"\"";
            else
              middle += "\"1\": \""+players[row-2]+"\"";
            var all = front + middle + tail;
            var jsonObj = JSON.parse(all);
            spreadsheet.add(jsonObj);
          }
          spreadsheet.send(function(err) {
            if (err) console.log(err);
            // to-do; add a different range of ways to respond who's responsibility it is for bottle
            say('Bottle Duty: '+person);
          });
        });
      });
    };
    bottle.who = function() {
      // to-do; return random person on the team
    };
    bottle.what = function() {
      var bottles = ['rum','vodka','whiskey','jaeger'];
      say(bottles[Math.random(0,bottles.length)]);
    };
    if (argument)
      bottle[argument]();
    else
      say('bottle fail');
  };
  this.bottle = bottle;

  // Runs the cool guy thing
  function coolguy() {
    say(cool());
  };
  this.coolguy = coolguy;


  // Regexes used for parsing stat info
  //   only currently used in scores
  var statsRegex = '([A-Za-z]+\\s*\\d{1}\\D*\\d{1})';
  var nameRegex = '[A-Za-z]+';
  var scoreRegex = '\\d{1}\\D*\\d{1}$';
  var pointsEarnedRegex = '\\d{1}';
  var pointsGivenRegex = '\\d{1}$';
  var dateRegex;
  var dateDayRegex = '[\-]{1}([\\d]{2})[T]{1}';
  var dateMonthRegex = '[\-]{1}([\\d]{2})[\-]{1}';
  var dateYearRegex = '[\\d]{4}';
  statsRegex = new RegExp(statsRegex, "g");
  /**
  * Scores command functions
  *   add, undo
  *
  * Adds Player scores to the It Is What It Is scoresheet
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  function scores(argument, message, sender) {
    scores.add = function() {
      say('Adding scores.');

      var addScores_ = function() {
        Spreadsheet.load({
          debug: true,
          spreadsheetId: config.ItIsWhatItIs_Spreadsheet_ID,
          worksheetId: config.ItIsWhatItIs_statsSheetID,
          oauth : {
            email: config.Frybot_Google_ServiceEmail,
            key: config.Frybot_Google_key
          }
        },
        function sheetReady(err, spreadsheet) {
          if(err) throw err;
          spreadsheet.receive(function(err, rows, info) {
            if(err) throw err;
            var matches = [];
            var statResults = message.match(statsRegex);
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
              dateRegex = new RegExp(dateDayRegex);
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
              // arrays and Player info updated accordingly
              for (i=0;i<config.all_players_.length;i++) {
                if (config.all_players_[i].name==match.player)
                  config.all_players_[i].addMatchStats(match.pointsEarned, match.pointsGiven, match.matchNumber, match.matchDate);
              }
              var addedMatchJSONasString = '{ "1": "'+match.player+'", "2": "'+match.pointsEarned+'", "3":"'+match.pointsGiven+'", "4":"'+match.matchNumber+'", "5":"'+match.matchDate+'" }';                                    
              matches.push(addedMatchJSONasString);
              config.all_matches_.push(match);
            });
            // shifts each generated match into a row and added to the spreadsheet
            var endRow = info.lastRow+1+matches.length;
            for (i=info.lastRow+1;i<endRow;i++) {
              var jsonObj = "{\""+i+"\":"+matches.shift()+"}";
              jsonObj = JSON.parse(jsonObj);
              spreadsheet.add(jsonObj); // adds row one by one
            }
            spreadsheet.send(function(err) {
              if(err) console.log(err);
                say('Scores added!');
            });
          });
        });
      };
      confirmedCommand = setTimeout(
        function() {
          if (message.match(statsRegex)!=null) {
            if (config.config.all_players_.length<=0||all_matches_.length<=0)
              cachePlayers_(addScores_);
            else
              addScores_();
          }
        },
        config.brainfart);
    };
    scores.callouts = function() {
      console.log('Callouts incoming');
      _.forEach(config.all_players_,function (player) {
        scores.streak(player);
      });
    };
    scores.lvp = function() {
      var leastValuablePlayer = 'Nico';
      _.forEach(config.all_players_, function (player) {
        if (leastValuablePlayer=='Nico')
          leastValuablePlayer = player;
        else if (player.mvp<leastValuablePlayer.mvp)
          leastValuablePlayer = player;
      });
      say('Current LVP: '+leastValuablePlayer.toStats());
    };
    scores.mvp = function() {
      var mostValuablePlayer = 'Oberg';
      _.forEach(config.all_players_, function (player) {
        if (mostValuablePlayer=='Oberg')
          mostValuablePlayer = player;
        else if (player.mvp>mostValuablePlayer.mvp)
          mostValuablePlayer = player;
      });
      say('Current MVP: '+mostValuablePlayer.toStats());
    };
    scores.of = function() {
      _.forEach(config.all_players_, function (player) {
      if (player.name==message)
        say('Stats: '+player.toStats());
    });
    };
    scores.streak = function (player) {
      // forces player from string to obj
      if (typeof player != Object)
        _.forEach(all_players_, function (players) {
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
      say(player.name+' is '+streak+' with ('+mod+streakN+')');
    };
    scores.update = function() {
      console.log('Updating Players from Scoresheet');
      var all_players_temp = [];
      var all_matches_temp = [];
      Spreadsheet.load({
        debug: true,
        spreadsheetId: config.ItIsWhatItIs_Spreadsheet_ID,
        worksheetId: config.ItIsWhatItIs_statsSheetID,
        oauth : {
          email: config.Frybot_Google_ServiceEmail,
          key: config.Frybot_Google_key
        }
      },
      function sheetReady(err, spreadsheet) {
        if(err) {
          console.log(err);
          throw err;
        }
        spreadsheet.receive(function(err, rows, info) {
          if(err) throw err;
          // header pickoff
          var once = true;
          var keys = '{"player":"","pointsEarned":"","pointsGiven":"","matchNumber":"","matchDate":""}';
          _.forEach(rows, function(row) {
              if (once) {
                once = false;
              }
              else {
                var match = JSON.parse(keys);
                // match = JSON.parse(match);
                match.player = row[1];
                match.pointsEarned = row[2];
                match.pointsGiven = row[3];
                match.matchNumber = row[4];
                lastMatchNum_ = row[4];
                match.matchDate = row[5];
                // console.log('match: '+JSON.stringify(match));
                // Adds to array of JSON of all matches
                all_matches_temp.push(match);
                // Adds the Player if new, updates scores afterwards
                if (all_players_temp.length==0) {
                  // console.log('Adding the first player: '+match.player);
                  var newPlayer = new Player({"name":match.player})
                  newPlayer.addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                  all_players_temp.push(newPlayer);
                }
                else {
                  var found = false;
                  for (j=0;j<all_players_temp.length;j++) 
                    if (all_players_temp[j].name==match.player) {
                      // console.log('Found player: '+match.player);
                      found = true;
                      all_players_temp[j].addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                    }
                  if (!found) {
                    // console.log('Adding new player: '+match.player);
                    var newPlayer = new Player({"name":match.player})
                    newPlayer.addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                    all_players_temp.push(newPlayer);
                  }
                }
                cache.all_players_ = all_players_temp;
                cache.all_matches_ = all_matches_temp;
              }
          });
          say('Season scores updated');
        });
      });
      
    };
    scores.undo = function() {

    };
    if (argument)
      self.scores[argument]();
    else
      say('What about the scores '+sender+'?');
  };
  this.scores = scores;

  /**
  * jk command functions
  *   butnotreally
  * 
  * Used to cancel the previously activated command within config.brainfart delay
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  function jk(argument, message, sender) {
    jk.butnotreally = function() {
      say('trololjk');
    };
    if (argument)
      this.jk[argument]();
    else {
      say('jk');
      clearTimeout(confirmedCommand);
    }
  };
  this.jk = jk;

  /**
  * Suck command functions
  *   my, his
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  function suck(argument, message, sender) {
    suck.my = function() {
      // if (sender!='Alex is Awesome'&&sender!='Schizo')
      //  return;
      if (sender=='Nico Mendoza'||sender=='Nico')
        say('yeah suck '+sender+'\'s tiny '+message+'!');
      else
        say('yeah suck '+sender+'\'s '+message+'!');
    };
    suck.his = function() {
      say('yeah suck his '+message+'! ');
      say('wait, what?');
    };
    if (argument)
      suck[argument]();
    else
      say('What about sucking '+sender+'\'s '+message+'?');
  };
  this.suck = suck;
})();

// module.exports = commands.activate;
/**
* Filter function activates the command process to be run
* @param {Object} request - the request as passed from bot.post(), includes text and id
*/
exports.activate = function(request) {
  var message = request.text || '';
  var sender = request.name;
  var matches = message.match(config.commandsRegex);
  for (i=0;i<matches.length;i++) 
    if (matches[i]==""||matches[i]==="")
      matches.splice(i,1);
  var command = matches[0].substring(1); // the first command match minus the slash
  var argument = matches[1]; // the first argument match
  if (argument!=undefined)
    message = message.substring(1+command.length+1+argument.length+1);
  else
    message = message.substring(1+command.length+1);
  //                           // slash + space + space
  // var i = sender.indexOf(' ');
  // sender = sender.substring(0,i);
  if (typeof self[command] === "function" ) {
    console.log('Activating: '+command+'['+argument+'] of '+sender+': \''+message+'\'');
    self[command](argument, message, sender);
    likeMessage_(sender);
  }
};

  /**
  * Likes the message with the given id
  * @param {string} message_id - The message's id
  */
  function likeMessage_(message_id) {GroupMe_API.Likes.create(config.GroupMe_AccessToken, config.GroupMe_group_ID, message_id, function(err,ret) {});};