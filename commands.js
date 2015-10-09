var config = require('./config.js');

var bot = require('./bot.js');
var cool = require('cool-ascii-faces');
var Spreadsheet = require('edit-google-spreadsheet');
var moment = require ('moment');
var _ = require('underscore');
require("colors");

// taco banana

var debugging = false;
var doesnotwork = true;

var this_ = this;


// // GroupMe API
// const GROUPME_ACCESS_TOKEN = "2f738e5005bc0133e1287ef6bffc9e1d";
// var GROUPME_API = require('groupme').Stateless
// var GROUPME_ItIsWhatItIs_ID = process.env.ItIsWhatItIs_ID;

// Google
var ItIsWhatItIs_serviceEmail = config.ItIsWhatItIs_serviceEmail;
var ItIsWhatItIs_keyFile = 'secret.pem';
var ItIsWhatItIs_SpreadsheetName = 'NEW It Is What It Is Tracker';
var ItIsWhatItIs_SpreadsheetID = '1AlMc7BtyOkSbnHQ8nP6G6PqU19ZBEQ0G5Fmkb4OsT08';
    // scores
var ItIsWhatItIs_statsSheetName = 'Current Season Stats';
var ItIsWhatItIs_statsSheetID = 'ot3ufy3';
var ItIsWhatItIs_frybotSheetName = 'frybot';
var ItIsWhatItIs_frybotSheetID = 'om5ojbr';
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
* @calls {bot.addThought(thoughts)}
*/

// list of all available commands and arguments
var commands = [
  'cool',
  'scores',
  'suck',
  'bottle',
  'ready'
];
var arguments = [
  "add",
  "undo",
  "my",
  "his",
  "who",
  "what",
  "up",
  "check"
];
var commandsRegex = "(\/"+commands.join("|")+")?("+arguments.join("|")+")?";
commandsRegex = new RegExp(commandsRegex, "gi");

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
  var command = message.match(commandsRegex)[1];
  var argument = message.match(commandsRegex)[3];
  // if the command is using multiple arguments then it needs to check each returned match in the [array] being checked with
  message = message.substring(1+command.length+1+argument.length+1);
                            // slash + space + space
  if (debugging) {
    console.log('regex: '+message.match(commandsRegex).toString());
    console.log('command: '+command);
    console.log('argument: '+argument);
    console.log('message: '+message);
    return;
  }
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
function cool() {
    bot.addThought(cool());
};

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
* @calls {bot.addThought(thoughts)}
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
      spreadsheetName: ItIsWhatItIs_SpreadsheetName,
      spreadsheetId: ItIsWhatItIs_SpreadsheetID,
      worksheetId: ItIsWhatItIs_statsSheetID,
      worksheetName: ItIsWhatItIs_statsSheetName,
      oauth : {
        email: ItIsWhatItIs_serviceEmail,
        keyFile: ItIsWhatItIs_keyFile
      }
    },
    function sheetReady(err, spreadsheet) {
      if(err) throw err;
      spreadsheet.receive(function(err, rows, info) {
        if(err) throw err;
        startRow = info.lastRow+1;
        endRow = startRow + stats.length;
        for (var i = startRow;i < endRow;i++) {
          var front = "{\""+i+"\": { ";
          var tail = "} }";
          var middle = "";
          var splitStats = stats[r].toString().split(",");
          // for each column of data into cells by
          for (var col = 1; col<=splitStats.length;col++) {
            if (col==splitStats.length)
              middle += "\""+col+"\": \""+splitStats[col-1]+"\""; // particular json seperation and labeling
            else
              middle += "\""+col+"\": \""+splitStats[col-1]+"\","; // particular json seperation and labeling
          }
          var all = front + middle + tail;
          var jsonObj = JSON.parse(all);
          spreadsheet.add(jsonObj); // adds row one by one
        }
       if (debugging)
         return;
       spreadsheet.send(function(err) {
          if(err) console.log(err);
            // bot.addThought('Scores added!');
        });
      });
    });
  };
  // doesn't work
  function undoScores(stats) {
    Spreadsheet.load({
      debug: true,
      spreadsheetName: ItIsWhatItIs_SpreadsheetName,
      spreadsheetId: ItIsWhatItIs_SpreadsheetID,
      worksheetId: ItIsWhatItIs_statsSheetID,
      worksheetName: ItIsWhatItIs_statsSheetName,
      oauth : {
        email: ItIsWhatItIs_serviceEmail,
        keyFile: ItIsWhatItIs_keyFile
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
        if (debugging||doesnotwork)
          return;
        spreadsheet.send(function(err) {
          if(err) console.log(err);
            // bot.addThought('Scores undone!');
        });
      });
    });
  };

  // command referenced functions
  // add scores
  scores.add = function() {
    addScores(parseForScores(message));
    // bot.addThought('Adding scores! I think...');
  };
  // undo scores
  scores.undo = function() {
   // undoScores();
    bot.addThought('fix your own mistakes');
  }
  if (argument)
    this.scores[argument]();
  else
    bot.addThought('What about the scores '+sender+'?');
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
* @calls {bot.addThought(thoughts)}
*/
function suck(argument, message, sender) {
  //  if (sender!='Alex Oberg'|'Alex')
  //    return;
    suck.my = function() {
      bot.addThought('yeah suck '+sender+'\'s '+message+'!');
    };
    suck.his = function() {
      bot.addThought('yeah suck his '+message+'!');
      bot.addThought('wait, what?');
    };
    if (argument)
      this.suck[argument]();
    else
      bot.addThought('What about sucking '+sender+'\'s '+message+'?');
};
this.suck = suck;

function ready(argument, message, sender) {
  // cache system for people ready'ing up

  //  if (sender!='Alex Oberg'|'Alex')
  //    return;

    var readyTimer;
    var readiedUp = [];
    function readyTimeUp() {
      if (readiedUp.length>=5) {
        bot.addThought('Ready check complete!');
        bot.addThought('Competing players: '+readiedUp.join(', ')+'.');
        clearInterval(readyTimer);
      }
      else {
        bot.addThought('..waiting on players..');
      }
    }
    ready.check = function() {
      var todayPlusOne = '';
      bot.addThought('Commencing ready check...');
      // start timer that eventually ends once 5 players have readied up
      readyTimer = setInterval(readyTimeUp,10000);
      readiedUp = [];
      bot.addThought('Available players for '+todayPlusOne+' say: /ready up .');
    };
    ready.up = function() {
      readiedUp.push(sender);
      bot.addThought(sender+' has readied up.');
    };
    if (argument)
      this.ready[argument]();
    else
      bot.addThought('What about readying up?');
};
this.ready = ready;

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
* @calls {bot.addThought(thoughts)}
*/
// function bottle(argument, message, sender) {
//     bottle.who = function() {
//       GROUPME_API.Groups.show(GROUPME_ACCESS_TOKEN, GROUPME_ItIsWhatItIs_ID,function(err,ret) {
//         if (!err) {
//           var members = [];
//           ret.members.forEach(function(member) {members.push(member.nickname);});
//           var whom = Math.round(Math.random(0,members.length));
//           bot.addThought(members[whom]+' on duty');
//         }
//       });
//     };
//     bottle.what = function() {
//       var bottles = ['rum','vodka','whiskey','jaeger'];
//       bots.addThought(bottles[Math.random(0,bottles.length)]);
//     };
//     if (argument)
//       this.bottle[argument]();
//     else
//       bot.addThought('bottle fail');
// };
// this.bottle = bottle;

function bottleDuty() {
  var person = 'Nico duh';
  Spreadsheet.load({
    debug: true,
    spreadsheetId: ItIsWhatItIs_SpreadsheetID,
    worksheetId: ItIsWhatItIs_frybotSheetID,
    // worksheetName: ItIsWhatItIs_frybotSheetName,
    oauth : {
      email: ItIsWhatItIs_serviceEmail,
      keyFile: ItIsWhatItIs_keyFile
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
      person = players[0];
      // var temp = players.shift
      players.push(players.shift());
      for (var row = 2;row < players.length+2;row++) {
        var front = "{\""+row+"\": { ";
        var tail = "} }";
        var middle = "";
        // for each column of data into cells by
        if (row==players.length)
          middle += "\"1\": \""+players[row-2]+"\""; // particular json seperation and labeling
        else
          middle += "\"1\": \""+players[row-2]+"\""; // particular json seperation and labeling
        var all = front + middle + tail;
        // console.log('all: '+all);
        var jsonObj = JSON.parse(all);
        spreadsheet.add(jsonObj); // adds row one by one
      }
      spreadsheet.send(function(err) {
        if(err) console.log(err);
        // console.log('person: '+person);
        bot.addThought('Weekly Bottle Reminder- '+person);
      });
    });
  });
}

exports.matches = matches;
exports.activate = activate;
exports.bottleDuty = bottleDuty;
