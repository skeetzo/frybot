var bot = require('./bot.js');
var cool = require('cool-ascii-faces');
var Spreadsheet = require('edit-google-spreadsheet');
var moment = require ('moment');
require("colors");

const ACCESS_TOKEN = "2f738e5005bc0133e1287ef6bffc9e1d";
var API = require('groupme').Stateless
var ItIsWhatItIs_ID = 14734775;

var debugging = false;

var this_ = this;

/**
* does
*
* @param {number} num - The number for things
* @return {number}
*/

var commands = [
  'cool',
  'scores',
  'suck',
  'bottle'
];
var arguments = [
  "add",
  "undo",
  "my",
  "his",
  "who",
  "what"
];
var commandsRegex = "((\/){1}("+commands.join("|")+")?)("+arguments.join("|")+")?";
commandsRegex = new RegExp(commandsRegex, "gix");

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
  var command = message.match(commandsRegex)[0];
  var argument = message.match(commandsRegex)[2];
  message = message.substring(command.length+argument.length+1);
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
function run(command, argument, message, sender) {
	  this_[command](argument, message, sender);
};

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
    return newStats;
  };

  function addScores(stats) {
    Spreadsheet.load({
      debug: true,
      spreadsheetName: 'NEW It Is What It Is Tracker',
      spreadsheetId: '1AlMc7BtyOkSbnHQ8nP6G6PqU19ZBEQ0G5Fmkb4OsT08',
      worksheetId: "ot3ufy3",
      worksheetName: 'Stats Form Responses',
      oauth : {
        email: '615638101068-ddthvbjttd2076flaqi1rm54divhpqvk@developer.gserviceaccount.com',
        keyFile: 'secret.pem'
      }
    }, 
    function sheetReady(err, spreadsheet) {
      if(err) throw err;
      spreadsheet.receive(function(err, rows, info) {
        if(err) throw err;
        startRow = info.lastRow+1;
        endRow = startRow + stats.length;
        for (var i = startRow,r=0;i < endRow;i++,r++) {
          var front = "{\""+i+"\": { ";
          var tail = "} }";
          var middle = "";
          var splitStats = stats[r].toString().split(",");
          for (var col = 1; col<=splitStats.length;col++) {   // for each column of data into cells by ,
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
            bot.addThought('Scores added!');
        });
      });
    });
  };
  function undoScores(stats) {
    Spreadsheet.load({
      debug: true,
      spreadsheetName: 'NEW It Is What It Is Tracker',
      spreadsheetId: '1AlMc7BtyOkSbnHQ8nP6G6PqU19ZBEQ0G5Fmkb4OsT08',
      worksheetId: "ot3ufy3",
      worksheetName: 'Stats Form Responses',
      oauth : {
        email: '615638101068-ddthvbjttd2076flaqi1rm54divhpqvk@developer.gserviceaccount.com',
        keyFile: 'secret.pem'
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
          for (var col = 1; col<=splitStats.length;col++) {   // for each column of data into cells by ,
            if (col==splitStats.length)
              middle += "\""+col+"\": \" \""; // particular json seperation and labeling
            else
              middle += "\""+col+"\": \" \","; // particular json seperation and labeling
          }
          var all = front + middle + tail;
          var jsonObj = JSON.parse(all);
          spreadsheet.add(jsonObj); // adds row one by one
        }
        if (debugging)
          return;
        spreadsheet.send(function(err) {
          if(err) console.log(err);
            bot.addThought('Scores undone!');
        });
      });
    });
  };

  // command referenced functions
  // add scores
  scores.add = function() {
    addScores(parseForScores(message));
    bot.addThought('Adding scores! I think...');
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

/**
* bottle command
*
* arguments: who, what
*
* thoughts: 
*   What about the scores sender?
*     Adding scores! I think...
*     fix your own mistakes
*       Scores added!
*       Scores undone!
*
* @param {string} argument - The argument to call
* @param {string} message - The message it's from
* @param {string} sender - The sender it's from
* @calls {bot.addThought(thoughts)}
*/
function bottle(argument, message, sender) {
    bottle.who = function() {
      API.Groups.show(ACCESS_TOKEN, ItIsWhatItIs_ID,function(err,ret) {
        if (!err) {
          var members = [];
          ret.members.forEach(function(member) {members.push(member.nickname);});
          var whom = Math.round(Math.random(0,members.length));
          bot.addThought(members[whom]+' on duty');
        }
      });    
    };
    bottle.what = function() {
      bots.addThought('rum');
    };
    if (argument)
      this.bottle[argument]();
    else
      bot.addThought('bottle fail');

};
this.bottle = bottle;



exports.matches = matches;
exports.activate = activate;
