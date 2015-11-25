
var cool = require('cool-ascii-faces');
var HTTPS = require('https');
var Spreadsheet = require('edit-google-spreadsheet');
var moment = require ('moment');
var _ = require('underscore');
var config = require('./config.js');
require("colors");

var GroupMe_API = require('groupme').Stateless;


var util = require('util');
var EventEmitter = require('events').EventEmitter;

// list of all available commands and arguments
var commands = [
  'face',
  'scores',
  'suck',
  'bottle'
];
var arguments = [
  "add",
  "undo",
  "my",
  "his",
  "duty",
  "who",
  "what"
];
var commandsRegex = "(\/"+commands.join("|\/")+")?("+arguments.join("|")+")?";
commandsRegex = new RegExp(commandsRegex, "gi");


var bot = function() {

  var this_ = this;

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
    if (request.text.search(commandsRegex)!=-1) {
      var tex = request.text;
      if (request.name)
        activate(request.text,request.name);
      else
        activate(request.text);
      if (request.id)
        likeMessage(request.id);
      this.res.writeHead(200);
      this.res.end();
    } else {
      this.res.writeHead(200);
      this.res.end();
    }
  };

  var thinker; // the timeout function
  var thoughts = []; // the thoughts to be posted
  function addThought(thought) {
    thoughts.push(thought);
    think();
  };

  function think() {
    clearTimeout(thinker);
    thinker = setTimeout(responder,6000);
  };

  var responder = function() {
    if (!config.responding)
      return;
    if (thoughts.length>=1)
      postMessage(thoughts.shift());
    else if (thoughts.length>0)
      postMessage(thoughts.join('.. '));
  };

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
          //neat
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
    if (config.debugging)
      return;
    botReq.end(JSON.stringify(body));
  };

  function likeMessage(message_id) {GroupMe_API.Likes.create(config.GroupMe_AccessToken, config.GroupMeID,message_id, function(err,ret) {});};

  function bottleReminder() {
    bottleDuty();
  };

  /**
  * template
  *
  * arguments: things
  *
  * thoughts:
  *    yeah suck sender's message!
  *    yeah suck his message!
  *      wait, what?
  *   What about sucking sender's message?
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  * @calls {addThought(thoughts)}
  */



  /**
  * checks regex matches
  *
  * @param {string} message - the message to be checked
  * @return {true/false}
  */
  function matches(message) {
    return message.match(commandsRegex);
  };

  /**
  * filter function activates the command process to be run
  *
  * @param {string} message - the string containing the message/command to be run
  * @param {string} sender - the string containing the name of the sender; parsed into just the first name
  * @calls {run(command,argument,message,sender)}
  */
  function activate(message, sender) {
    var matches = message.match(commandsRegex);
    for (i=0;i<matches.length;i++) {
      if (matches[i]==='')
        matches.splice(i,1);

    }

    var command = matches[0].substring(1);
    var argument = matches[1];

    // if the command is using multiple arguments then it needs to check each returned match in the [array] being checked with
    if (argument!=undefined)
      message = message.substring(1+command.length+1+argument.length+1);
    else
      message = message.substring(1+command.length+1);
    //                           // slash + space + space
    // if (config.debugging) {
      console.log('matches: '+matches);
      console.log('command: '+command);
      console.log('argument: '+argument);
      console.log('message: '+message);
      // return;
    
    var i = sender.indexOf(' ');
    sender = sender.substring(0,i);
    run(command,argument,message,sender);
  };

  /**
  * runs the command
  *
  * @param {string} command - the command
  * @param {string} argument - the argument
  * @param {string} message - the string containing the message/command to be run
  * @param {string} sender - the string containing the name of the sender; already parsed into just the first name
  * @calls {this[command](argument, message, sender)}
  */
  function run(command, argument, message, sender) {this_[command](argument, message, sender);};

  var statsRegex = '([A-Za-z]+\\s*\\d{1}\\D*\\d{1})';
  var nameRegex = '[A-Za-z]+';
  var scoreRegex = '\\d{1}\\D*\\d{1}$';
  var pointsEarnedRegex = '\\d{1}';
  var pointsGivenRegex = '\\d{1}$';
  var dateRegex;
  var dateDayRegex = '[\-]{1}([\\d]{2})[T]{1}';
  var dateMonthRegex = '[\-]{1}([\\d]{2})[\-]{1}';
  var dateYearRegex = '[\\d]{4}';

  /**
  * runs the cool guy thing
  *
  * @return {cool guy face as string}
  */
  function face() {
    addThought(cool());
  };
  this.face = face;
  /**
  * scores command
  *
  * arguments: add, undo
  *
  * thoughts:
  *    Adding scores! I think...
  *      Scores added!
  *    fix your own mistakes
  *      Scores undone!
  *   What about the scores sender?
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  * @calls {addThought(thoughts)}
  */
  function scores(argument, message, sender) {

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
         if (config.debugging)
           return;
         spreadsheet.send(function(err) {
            if(err) console.log(err);
              // addThought('Scores added!');
          });
        });
      });
    };
    // doesn't work
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
            spreadsheet.add(jsonObj); // adds row one by one
          }
          if (config.debugging)
            return;
          spreadsheet.send(function(err) {
            if(err) console.log(err);
              // addThought('Scores undone!');
          });
        });
      });
    };

    // command referenced functions
    // add scores
    scores.add = function() {
      addScores(parseForScores(message));
      // addThought('Adding scores! I think...');
    };
    // undo scores
    scores.undo = function() {
     // undoScores();
      addThought('fix your own mistakes');
    }
    if (argument)
      this.scores[argument]();
    else
      addThought('What about the scores '+sender+'?');
  };
  this.scores = scores;

  /**
  * suck command
  *
  * arguments: my, his
  *
  * thoughts:
  *    yeah suck sender's message!
  *    yeah suck his message!
  *      wait, what?
  *   What about sucking sender's message?
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  * @calls {addThought(thoughts)}
  */
  function suck(argument, message, sender) {
    //  if (sender!='Alex Oberg'|'Alex')
    //    return;
      suck.my = function() {
        addThought('yeah suck '+sender+'\'s '+message+'!');
      };
      suck.his = function() {
        addThought('yeah suck his '+message+'!');
        addThought('wait, what?');
      };
      if (argument)
        this.suck[argument]();
      else
        addThought('What about sucking '+sender+'\'s '+message+'?');
  };
  this.suck = suck;

/**
* bottle command
*
* arguments: who, what
*
* thoughts:
*   bottle fail
*     [random name] on duty
*
* @param {string} argument - The argument to call
* @param {string} message - The message it's from
* @param {string} sender - The sender it's from
* @calls {addThought(thoughts)}
*/
function bottle(argument, message, sender) {

  function bottleDuty() {
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
        console.log(rows);
        _.forEach(rows, function(col) {
          players.push(col[1]);
        });
        var person = players[0];
        // var temp = players.shift
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
          if(err) console.log(err);
          addThought('Weekly Bottle Reminder- '+person);
        });
      });
    });
  };

  bottle.duty = function () {
    bottleDuty();
  }
  bottle.who = function() {
    GROUPME_API.Groups.show(GROUPME_ACCESS_TOKEN, GROUPME_ItIsWhatItIs_ID,function(err,ret) {
      if (!err) {
        var members = [];
        ret.members.forEach(function(member) {members.push(member.nickname);});
        var whom = Math.round(Math.random(0,members.length));
        addThought(members[whom]+' on duty');
      }
    });
  };
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


  

  function poke() {
    think();
  };

  function test(testMessage) {
    postMessage(testMessage);
  };


}

util.inherits(bot, EventEmitter);

module.exports = bot;














