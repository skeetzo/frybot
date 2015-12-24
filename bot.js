require("colors");
var _ = require('underscore');
var cool = require('cool-ascii-faces');
var config = require('./config.js');
var CronJob = require('cron').CronJob;
var EventEmitter = require('events').EventEmitter;
var GroupMe_API = require('groupme').Stateless;
var HTTPS = require('https');
var moment = require ('moment');
var Spreadsheet = require('edit-google-spreadsheet');
var util = require('util');

/**
 * @title It Is What It Is GroupMe Bot, Frybot
 * @author Schizo
 * @version 0.0.6
 */

/* To-do

and calling recent stats by season etc by name like a real db	
calling out hot streaks in the next season	
calling out losing streaks in the next season	
fix / update adding scores regexes	
add the (commander) lock	
	and (master) lock
 
*/
// Updated via updatePlayers
var all_players_ = [];
var all_matches_ = [];

var bot = function() {
  var this_ = this;
  var lastMatchNum_ = 0;

  // CronJob activities

  /**
  * Called weekly on Tuesday at 6:00 PM before 7:30 PM league match
  *  by index.js  
  *  
  *
  *  [sample chat input here]
  *
  *
  * started- yes
  */
  var pregameJob_ = new CronJob({
    cronTime: '00 45 00 * * 2',
      onTick: function pregame() {

        // should call updatePlayers() as a callback in a way

        // get location
        var location = 'a place';
        postThought_('It\'s League night bitches!');
        postThought_('Playing @: '+location);
        // postThought_();
                   // Bottle Duty: (a name)
        this_.bottle('duty');

        var currentMVP = 'DROD';
        var currentLVP = 'Gabe';
        var hotStreaker = 'Alex';
        var hotStreak = 6; //hotStreaker's wins
        postThought_('Current MVP: '+currentMVP);
        postThought_('Current LVP: '+currentLVP);
        postThought_('And finally, '+hotStreaker+' is on a hot streak with '+hotStreak+' wins!');



      },
      start: true,
      timeZone: 'America/Los_Angeles'
  });

  // Post

  /**
  * Likes the message with the given id
  * @param {string} message_id - The message's id
  */
  function likeMessage_(message_id) {GroupMe_API.Likes.create(config.GroupMe_AccessToken, config.GroupMeID,message_id, function(err,ret) {});};

  /**
  * Called from index.js upon groupme posts
  * Runs activate(request) upon successful match
  */
  bot.prototype.post = function() {
    if (this.req == undefined || this.req == null) 
      return;
    if (this.req.chunks == undefined || this.req.chunks == null) 
      return;
    var request = JSON.parse(this.req.chunks[0]);
    if (!request.text || !request.name || !request.id)
      return;
    if (request.name==config.NAME)
      return;
    if (request.text.search(config.commandsRegex)!=-1) 
      activate_(request);
    this.res.writeHead(200);
    this.res.end();
  };

  // Prepares the thoughts_ to be POSTed based upon length
  var postMaster_ = function() {
    if (!config.responding)
      return;
    if (thoughts_.length>=3) {
      // thought string is checked for end of sentence chars
      // return their same thing
      // else return default sentence smash
      for (i=0;i<thoughts_.length;i++) {
        if ((thoughts_[i].charAt(thoughts_[i].length-1)!='!')&&(thoughts_[i].charAt(thoughts_[i].length-1)!='-')&&(thoughts_[i].charAt(thoughts_[i].length-1)!=':')&&(thoughts_[i].charAt(thoughts_[i].length-1)!=',')&&(thoughts_[i].charAt(thoughts_[i].length-1)!='.'))
          thoughts_[i]+='. ';
        else
          thoughts_[i]+=' '; 
      }
      thoughts_ = thoughts_.join('');   
      postMessage_(thoughts_);
      thoughts_ = [];
    }
    else
      postMessage_(thoughts_.shift());
  };

  /**
  * Posts the given message via the GroupMe bot
  * @param message
  */
  function postMessage_(message) {
    var options, body, botReq;
    options = {
      hostname: 'api.groupme.com',
      path: '/v3/bots/post',
      method: 'POST'
    };
    body = {
      "bot_id" : config.botID,
      "text" : message
    };
    console.log(('sending ' + message + ' to ' + config.botID).green);
    botReq = HTTPS.request(options, function(res) {
        if(res.statusCode == 202) {
          // neat, why is this even here?
        } else {
          console.log('rejecting bad status code ' + res.statusCode);
        }
    });
    botReq.on('error', function(err) {
      console.log('error posting message '  + JSON.stringify(err));
    });
    botReq.on('timeout', function(err) {
      console.log('timeout posting message '  + JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
  };

  /**
  * Adds a thought {string} to the thoughts_ {array} that will be POSTed
  * @param thought {string} what will be POSTed 
  */
  var thoughts_ = []; // the thoughts_ to be posted
  function postThought_(thought) {
    thoughts_.push(thought);
    clearTimeout(postMaster_);
    setTimeout(postMaster_, config.responseTime);
  };

  // Commands

  var confirmedCommand;

  /**
  * Filter function activates the command process to be run
  * @param {Object} request - the request as passed from post(), includes text and id
  */
  function activate_(request) {
    var message = request.text;
    var sender = request.id;
    var matches = message.match(config.commandsRegex);
    if (config.debugging) console.log("matches before: "+matches);
    for (i=0;i<matches.length;i++) 
      if (matches[i]==""||matches[i]==="")
        matches.splice(i,1);
    if (config.debugging) console.log("matches after: "+matches);
    var command = matches[0].substring(1); // the first command match minus the slash
    var argument = matches[1]; // the first argument match
    if (argument!=undefined)
      message = message.substring(1+command.length+1+argument.length+1);
    else
      message = message.substring(1+command.length+1);
    //                           // slash + space + space
    if (config.debugging) {
      console.log('matches: '+matches);
      console.log('command: '+command);
      console.log('argument: '+argument);
      console.log('message: '+message);
      return;
    }
    var i = sender.indexOf(' ');
    sender = sender.substring(0,i);
    if (typeof this_[command] === "function" ) {
      this_[command](argument, message, sender);
      likeMessage_(sender);
    }
  };

  /**
  * Bottle command functions
  *  who, what
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  function bottle(argument, message, sender) {
    bottle.duty = function () {
      Spreadsheet.load({
        debug: true,
        spreadsheetId: config.ItIsWhatItIs_SpreadsheetID,
        worksheetId: config.ItIsWhatItIs_frybotSheetID,
        oauth : {
          email: config.ItIsWhatItIs_serviceEmail,
          keyFile: config.ItIsWhatItIs_keyFile
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
            postThought_('Bottle Duty: '+person);
          });
        });
      });
    };
    bottle.who = function() {};
    bottle.what = function() {
      var bottles = ['rum','vodka','whiskey','jaeger'];
      bots.postThought_(bottles[Math.random(0,bottles.length)]);
    };
    if (argument)
      this.bottle[argument]();
    else
      postThought_('bottle fail');
  };
  this.bottle = bottle;

  // Runs the cool guy thing
  function coolguy() {
    postThought_(cool());
  };
  this.coolguy = coolguy;

  /**
  * Scores command functions
  *   add, undo
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  function scores(argument, message, sender) {
    // Regexes used for parsing stat info
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

    var addScores_ = function() {
      Spreadsheet.load({
        debug: true,
        spreadsheetName: config.ItIsWhatItIs_SpreadsheetName,
        spreadsheetId: config.ItIsWhatItIs_SpreadsheetID,
        worksheetId: config.ItIsWhatItIs_statsSheetID,
        worksheetName: config.ItIsWhatItIs_statsSheetName,
        oauth : {
          email: config.ItIsWhatItIs_serviceEmail,
          keyFile: config.ItIsWhatItIs_keyFile
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
            for (i=0;i<all_players_.length;i++) {
              if (all_players_[i].name==match.player)
                all_players_[i].addMatchStats(match.pointsEarned, match.pointsGiven, match.matchNumber, match.matchDate);
            }
            var addedMatchJSONasString = '{ "1": "'+match.player+'", "2": "'+match.pointsEarned+'", "3":"'+match.pointsGiven+'", "4":"'+match.matchNumber+'", "5":"'+match.matchDate+'" }';                                    
            matches.push(addedMatchJSONasString);
            all_matches_.push(match);
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
              postThought_('Scores added!');
          });
        });
      });
    };
    scores.add = function() {
      postThought_('Adding scores.');
      confirmedCommand = setTimeout(
        function() {
          if (message.match(statsRegex)!=null)
            addScores_();
        },
        config.brainfart);
    };
    scores.undo = function() {

    }
    if (argument)
      this_.scores[argument]();
    else
      postThought_('What about the scores '+sender+'?');
  };
  this.scores = scores;

  function jk(argument, message, sender) {
    // if (argument)
    //   this.jk[argument]();
    // else {
      postThought_('jk');
      clearTimeout(confirmedCommand);
    // }
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
    if (sender!='Alex Oberg'||'Alex')
       return;
    // if (sender=='Nico Mendoza'||'Nico') {}
    suck.my = function() {
      postThought_('yeah suck '+sender+'\'s '+message+'!');
    };
    suck.his = function() {
      postThought_('yeah suck his '+message+'! ');
      postThought_('wait, what?');
    };
    if (argument)
      this.suck[argument]();
    else
      postThought_('What about sucking '+sender+'\'s '+message+'?');
  };
  this.suck = suck;

  // Google Sheets
  /**
  * Resets Player scores for the season
  *  Resets Array of the season's match data
  *
  * @param function callback the function to be called once done loading and reading the sheet and updating the arrays
  */
  function cachePlayers_(callback) {
    all_players_ = [];
    all_matches_ = [];
    Spreadsheet.load({
      debug: true,
      spreadsheetName: config.ItIsWhatItIs_SpreadsheetName,
      spreadsheetId: config.ItIsWhatItIs_SpreadsheetID,
      worksheetId: config.ItIsWhatItIs_statsSheetID,
      worksheetName: config.ItIsWhatItIs_statsSheetName,
      oauth : {
        email: config.ItIsWhatItIs_serviceEmail,
        keyFile: config.ItIsWhatItIs_keyFile
      }
    },
    function sheetReady(err, spreadsheet) {
      if(err) throw err;
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
              all_matches_.push(match);
              // Adds the Player if new, updates scores afterwards
              if (all_players_.length==0) {
                if (config.debugging) console.log('Adding the first player: '+match.player);
                var newPlayer = new Player({"name":match.player})
                newPlayer.addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                all_players_.push(newPlayer);
              }
              else {
                var found = false;
                for (j=0;j<all_players_.length;j++) 
                  if (all_players_[j].name==match.player) {
                    if (config.debugging) console.log('Found player: '+match.player);
                    found = true;
                    all_players_[j].addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                  }
                if (!found) {
                  if (config.debugging) console.log('Adding new player: '+match.player);
                  var newPlayer = new Player({"name":match.player})
                  newPlayer.addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                  all_players_.push(newPlayer);
                }
              }
            }
        });
        if (callback)
          callback();
      });
    });
  }

  /**
  * 12/23/15
  * @author Schizo
  *
  * Player Class from It Is What It Is Sheet Scripts modified for easy Player manipulation
  *  records name, matches (earned, given, match#), won, lost, skunks, skunked, sl
  *
  * @constructor
  * @param stats {data} the data of the player in the format of {"name":name,"sl":sl,etc}
  */
  function Player(stats) {
    if (stats.name==null||stats.name==undefined)
      stats.name = "Default";
    if (stats.matches==null||stats.matches==undefined)
      stats.matches = [];
    if (stats.pointsEarned==null||stats.pointsEarned==undefined)
      stats.pointsEarned = 0;
    if (stats.pointsGiven==null||stats.pointsGiven==undefined)
      stats.pointsGiven = 0;
    if (stats.matchesWon==null||stats.matchesWon==undefined)
      stats.matchesWon = 0;
    if (stats.matchesLost==null||stats.matchesLost==undefined)
      stats.matchesLost = 0;
    if (stats.skunks==null||stats.skunks==undefined)
      stats.skunks = 0;
    if (stats.skunked==null||stats.skunked==undefined)
      stats.skunked = 0;
    if (stats.sl==null||stats.sl==undefined)
      stats.sl = 3;
    // console.log("New Player: "+stats.name+' - '+stats.sl);
    this.name = stats.name;
    this.matches = stats.matches; // [[pointsEarned,pointsGiven,when]]
    this.pointsEarned = stats.pointsEarned;
    this.pointsGiven = stats.pointsGiven;
    this.matchesWon = stats.matchesWon;
    this.matchesLost = stats.matchesLost;
    this.skunks = stats.skunks;
    this.skunked = stats.skunked;
    this.sl = stats.sl;
  };

  Player.prototype = {
    // MATCH
    addMatchStats: function(pointsEarned, pointsGiven, matchDate, matchNum) {
      this.matches.push([pointsEarned, pointsGiven, matchDate, matchNum]);
      this.pointsEarned+=pointsEarned;
      this.pointsGiven+=pointsGiven;
      if (pointsEarned>pointsGiven)
        this.matchesWon++;
      else
        this.matchesLost++;
      this.skunkCheck(pointsEarned,pointsGiven);
    },
    // SKUNKS
    addSkunk: function() {
        this.skunks++;
    },
    addSkunked: function() {
        this.skunked++;
    },
    skunkCheck: function(earned, given) {
      if (earned==3&&given==0)
        this.addSkunk();
      if (given==3&&earned==0)
        this.addSkunked();
      // if (this.name=="Danny")
        // this.addSkunk();
    },
    getName: function() {
      return this.name.toString();},
    getWins: function() {
      return this.pointsEarned;},
    getLosses: function() {
      return this.pointsGiven;},
    getMatches: function() {
      return this.matches;},
    getMatchWins: function() {
      return this.matchesWon;},
    getMatchLosses: function() {
      return this.matchesLost;},
    getSkunks: function() {
      return this.skunks;},
    getSkunked: function() {
      return this.skunked;},
    getSL: function() {
      return this.sl;},
    toString: function() {
      var returned = [];
      returned.push("{ Name: "+this.name);
      returned.push(" Points Earned: "+this.pointsEarned);
      returned.push(" Points Given: "+this.pointsGiven);
      returned.push(" Matches Won: "+this.matchesWon);
      returned.push(" Matches Lost: "+this.matchesLost);
      returned.push(" Skunks: "+this.skunks);
      returned.push(" Skunked: "+this.skunked+" }");
      return returned.toString();
    },
    statsToRow: function() {
      returned.push(this.name);
      returned.push(this.pointsEarned);
      returned.push(this.pointsGiven);
      returned.push(this.matchesWon);
      returned.push(this.matchesLost);
      returned.push(this.skunks);
      returned.push(this.skunked);
      return returned;
    }
  };

  bot.prototype.test = function() {
    cachePlayers_(function theCallback() {
      // console.log(JSON.stringify(playerArray));
      scores('add','Taco 2:1 Banana 3:2');

    });
  };
}

util.inherits(bot, EventEmitter);

module.exports = bot;












/*   To Do

On the starting of a new season, do newSeasonStuff() {
  announce a new season and its dates
  reset the sheets somehow, perhaps by affecting a cell that contains a date that the google scripts trigger off of
  introduce the players with introduce()
  remind returning players of past failures by using all of their stats to calculate those who got skunked the most
    offer to remove lowest player from the team
  wishes everyone (except nico) good luck
}

introduce() {
  says random shit for each player in a WWE style intro
}










*/
