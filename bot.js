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

/* To-do

and calling recent stats by season etc by name like a real db	
calling out hot streaks in the next season	
calling out losing streaks in the next season	
fix / update adding scores regexes	
add the (commander) lock	
	and (master) lock
 





*/

var bot = function() {
  var this_ = this;


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
  var pregameJob = new CronJob({
    cronTime: '00 45 23 * * 2',
      onTick: function pregame() {
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

  var endSentenceRegex = '.!?-:,';
  endSentenceRegex = new RegExp(endSentenceRegex, "g");

  var postMaster_ = function() {
    if (!config.responding)
      return;
    if (thoughts_.length>=3) {
      postMessage_(thoughts_.join(function(thought) {
        // thought string is checked for regex end sentence chars
        // return their same thing
        // else return default sentence smash
        if (thought.match(endSentenceRegex))
          return ' ';
        return '. ';
      }));
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

    // used to parse the stats from the message
    function parseForScores(text) {
      // Parse parsedStats
      var newStats = [];
      regex = new RegExp(statsRegex, "g");
      var statResults = text.match(regex);
      var matchNum = 1;
      statResults.forEach(function (stat) {
        var parsedStats = [];
        // find name
        regex = new RegExp(nameRegex);
        var name = regex.exec(stat);
        name = name[0];
        // find points earned
        regex = new RegExp(pointsEarnedRegex);
        var pointsEarned = regex.exec(stat);
        pointsEarned = pointsEarned[0];
        // find points given
        regex = new RegExp(pointsGivenRegex);
        var pointsGiven = regex.exec(stat);
        pointsGiven = pointsGiven[0];
        var timestamp = moment().format();
        dateRegex = new RegExp(dateDayRegex);
        var day = dateRegex.exec(timestamp);
        day = day[1];
        dateRegex = new RegExp(dateMonthRegex);
        var month = dateRegex.exec(timestamp);
        month = month[1];
        dateRegex = new RegExp(dateYearRegex);
        var year = dateRegex.exec(timestamp);
        parsedStats.push(timestamp);
        parsedStats.push(name);
        parsedStats.push(pointsEarned);
        parsedStats.push(pointsGiven);
        parsedStats.push(matchNum+'');
        parsedStats.push(month+'/'+day+'/'+year);
        newStats.push(parsedStats);
        matchNum++;
      });
      // Add parsedStats
      var startRow;
      var endRow;
      return newStats; // parsed stats
    };

    var addScores_ = function(stats) {
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
          console.log("stats: "+stats);
          startRow = info.lastRow+1;
          endRow = startRow + stats.length;
          console.log("end row: "+endRow);
          for (var i = startRow;i < endRow;i++) {
            var front = "{\""+i+"\": { ";
            var tail = "} }";
            var middle = "";
            stats = stats.join(",");
            console.log("stats: "+stats);
            // for each column of data into cells by
            for (var col = 1; col<=stats.length;col++) {
              if (col==stats.length)
                middle += "\""+col+"\": \""+stats[col-1]+"\""; // particular json seperation and labeling
              else
                middle += "\""+col+"\": \""+stats[col-1]+"\","; // particular json seperation and labeling
            }
            var all = front + middle + tail;
            console.log("all: "+all);
            var jsonObj = JSON.parse(all);
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
          addScores_(parseForScores(message));
        },
        config.brainfart);
    };
    scores.undo = function() {

    }
    if (argument)
      this.scores[argument]();
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
