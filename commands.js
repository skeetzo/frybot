var bot = require('./bot.js');
var cool = require('cool-ascii-faces');
var Spreadsheet = require('edit-google-spreadsheet');
var moment = require ('moment');
require("colors");

var debugging = false;

var commands = [
  'cool',
  'scores',
  'suck'
];
var arguments = [
  "add",
  "undo",
  "my"
];
var commandsRegex = "([\/]{1}"+commands.join("|")+")?("+arguments.join("|")+")?";
commandsRegex = new RegExp(commandsRegex, "gi");

function matches(message) {
  return message.match(commandsRegex);
};

function activate(theCommand, theSender) {
  var command = theCommand.match(commandsRegex)[0];
  var argument = theCommand.match(commandsRegex)[2];
  if (theSender)
    run(command,argument,theCommand,theSender);
  else
    run(command,argument,theCommand)
};

function run(command, argument, message, sender) {
	if (!message)
		message = 'empty message';
	if (!argument)
		argument = 'empty argument';
	if (!command)
		return 'empty command';
	this[command](argument, message, sender);
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

function cool() {
    bot.addThought(cool());
};

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
    bot.addThought('What about the scores '+'[respondTo]'+'?');
};
this.scores = scores;

function suck(argument, theMessage) {
  //  if (respondTo!='Alex Oberg'|'Alex')
  //    return;
    suck.my = function() {
      bot.addThought('yeah suck '+'[respondTo]'+'\'s dick!');
    };
    if (argument)
      this.suck[argument]();
    else
      bot.addThought('What about sucking '+'[respondTo]'+'\'s dick?');
};
this.suck = suck;



exports.exists = exists;
exports.activate = activate;
