require("colors");
var _ = require('underscore');
var cool = require('cool-ascii-faces');
var config = require('./config.js');
var EventEmitter = require('events').EventEmitter;
var GroupMe_API = require('groupme').Stateless;
var HTTPS = require('https');
var moment = require ('moment');
var Spreadsheet = require('edit-google-spreadsheet');
var util = require('util');

var bot = function() {
  var this_ = this;

  /**
  * Adds a thought {string} to the thoughts {array} that will be POSTed
  * @param thought {string} what will be POSTed 
  */
  var thoughts = []; // the thoughts to be posted
  function addThought(thought) {
    thoughts.push(thought);
    this_.emit("thought added");
  };

  /**
  * Likes the message with the given id
  * @param {string} message_id - The message's id
  */
  function likeMessage(message_id) {GroupMe_API.Likes.create(config.GroupMe_AccessToken, config.GroupMeID,message_id, function(err,ret) {});};

  /**
  * Posts the given message via the GroupMe bot
  * @param message
  */
  function postMessage(message) {
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

  // Runs activate(request) upon successful match
  this.respond = function() {
    if (this.req == undefined || this.req == null) 
      return;
    if (this.req.chunks == undefined || this.req.chunks == null) 
      return;
    var request = JSON.parse(this.req.chunks[0]);
    if (!request.text && !request.name)
      return;
    if (request.name==config.NAME)
      return;
    if (request.text.search(config.commandsRegex)!=-1) 
      activate(request);
    this.res.writeHead(200);
    this.res.end();
  };

  // Prepares the thoughts to be POSTed
  var responder = function() {
    if (!config.responding)
      return;
    if (thoughts.length>=1)
      postMessage(thoughts.shift());
    else if (thoughts.length>0)
      postMessage(thoughts.join('.. '));
  };

  // Commands

  /**
  * Filter function activates the command process to be run
  * @param {Object} request - the request as passed from respond(), includes text and id
  */
  function activate(request) {
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
      likeMessage(sender);
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
            addThought('Weekly Bottle Reminder- '+person);
          });
        });
      });
    };
    bottle.who = function() {};
    bottle.what = function() {
      var bottles = ['rum','vodka','whiskey','jaeger'];
      bots.addThought(bottles[Math.random(0,bottles.length)]);
    };
    if (argument)
      this.bottle[argument]();
    else
      addThought('bottle fail');
  };
  this.bottle = bottle;

  // Runs the cool guy thing
  function coolguy() {
    addThought(cool());
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

    function addScores(stats) {
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
            var jsonObj = JSON.parse(all);
            spreadsheet.add(jsonObj); // adds row one by one
          }
         spreadsheet.send(function(err) {
            if(err) console.log(err);
            addThought('Scores added!');
          });
        });
      });
    };

    // doesn't work yet
    function undoScores(stats) {
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
          startRow = info.lastRow;
          endRow = startRow - stats.length;
          for (var i = startRow,r=0;i > endRow;i--,r--) {
            var front = "{\""+i+"\": { ";
            var tail = "} }";
            var middle = "";
            var splitStats = stats[r].toString().split(",");
            // for each column of data into cells by
            for (var col = 1; col<=splitStats.length;col++) {
              if (col==splitStats.length)
                middle += "\""+col+"\": \" \""; // particular json seperation and labeling
              else
                middle += "\""+col+"\": \" \","; // particular json seperation and labeling
            }
            var all = front + middle + tail;
            var jsonObj = JSON.parse(all);
            console.log("jsonObj: "+jsonObj);
            // spreadsheet.add(jsonObj); // adds row one by one
          }
          // spreadsheet.send(function(err) {
          //   if(err) console.log(err);
              // addThought('Scores undone!');
          // });
        });
      });
    };

    scores.add = function() {
      addScores(parseForScores(message));
    };
    scores.undo = function() {
      undoScores();
    }
    if (argument)
      this.scores[argument]();
    else
      addThought('What about the scores '+sender+'?');
  };
  this.scores = scores;

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
      addThought('yeah suck '+sender+'\'s '+message+'!');
    };
    suck.his = function() {
      addThought('yeah suck his '+message+'! ');
      addThought('wait, what?');
    };
    if (argument)
      this.suck[argument]();
    else
      addThought('What about sucking '+sender+'\'s '+message+'?');
  };
  this.suck = suck;

  // "thought added" event calls responder() to say all current thoughts
  this.on("thought added", function() {
    setTimeout(responder,config.responseTime);
  });
}

util.inherits(bot, EventEmitter);

module.exports = bot;
