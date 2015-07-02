var bot = require('./bot.js');
var cool = require('cool-ascii-faces');
var Spreadsheet = require('edit-google-spreadsheet');
var moment = require ('moment');
require("colors");

var seconds = 1000;
var five = 5;

var debugging = false;
var thinkingSpeed = five*seconds;

var thoughts = ['huh'];
var thinking;

var powerup = function thinkAboutWhatToDo() {
  thinking = setInterval(unload,thinkingSpeed);
};

function unload() {
	bot.postMessage(thoughts.shift());
  if (thoughts.size==0)
	 cooldown();
}

function cooldown() {
	clearInterval(thinking);
};

function availablePowers(command, argument, message) {
	if (!message)
		message = 'empty message';
	if (!argument)
		argument = 'empty argument';
	if (!command)
		return 'empty command';
//	thoughts = ['huh?'];
thoughts = [];
	powerup();
	this[command](argument, message);
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
    thoughts.push(cool());
};

function scores(argument, theMessage) {

  function parseForScores(message) {
    // Parse stats
    var newStats = [];
    regex = new RegExp(statsRegex, "g");
    var statResults = message.match(regex);
    var matchNum = 1;
    statResults.forEach(function (theMessage) {
      var stats = [];
      // find name
      regex = new RegExp(nameRegex);
      var name = regex.exec(theMessage);
      name = name[0];
      // find points earned
      regex = new RegExp(pointsEarnedRegex);
      var pointsEarned = regex.exec(theMessage);
      pointsEarned = pointsEarned[0];
      // find points given
      regex = new RegExp(pointsGivenRegex);
      var pointsGiven = regex.exec(theMessage);
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
      stats.push(timestamp);
      stats.push(name);
      stats.push(pointsEarned);
      stats.push(pointsGiven);
      stats.push(matchNum+'');
      stats.push(month+'/'+day+'/'+year);
      newStats.push(stats);
      matchNum++;
    });
    // Add stats
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
            thoughts.push('Scores added!');
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
            thoughts.push('Scores undone!');
        });
      });
    });
  };

  // command referenced functions
  // add scores
  scores.add = function() {
    addScores(parseForScores(theMessage));
    thoughts.push('Adding scores! I think...');
  };
  // undo scores
  scores.undo = function() {
   // undoScores();
    thoughts.push('fix your own mistakes');
  }
  if (argument)
    this.scores[argument]();
  else
    thoughts.push('What about the scores '+'[respondTo]'+'?');
};
this.scores = scores;

function suck(argument, theMessage) {
  //  if (respondTo!='Alex Oberg'|'Alex')
  //    return;
    suck.my = function() {
      thoughts.push('yeah suck '+'[respondTo]'+'\'s dick!');
    };
    if (argument)
      this.suck[argument]();
    else
      thoughts.push('What about sucking '+'[respondTo]'+'\'s dick?');
};
this.suck = suck;

exports.availablePowers = availablePowers;