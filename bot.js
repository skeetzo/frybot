var HTTPS = require('https');
var cool = require('cool-ascii-faces');
var moment = require ('moment');
var Spreadsheet = require('edit-google-spreadsheet');
require('dotenv').load();
require("colors");

var debugging = false;

     /*
     if (key=='/cool guy')
       botResponse = cool();
     else if (key=='/scores')
       botResponse = botCommand('scores');
     else if (key=='/bottle')
       botResponse = "Who's got bottle service?";
     else if (key=='/roster')
       botResponse = "The players on the team are...";
     else if (key=='/player\'s score')
       botResponse = "x\'s total points are...";
     */

function scytalia() {
  this.botID = process.env.BOT_ID;

  if (debugging)
    this.botID = 6;
  this.botResponse = "burrito";
  this.respondTo;

  this.commands = [
          'cool',
          'scores',
          'suck'
  ];
  this.comandsArguments = ["add","undo","my"];
  this.commandsRegex = "([//]{1}"+commands.join("|")+")?("+comandsArguments.join("|")+")?";
  this.commandsRegex = new RegExp(commandsRegex, "gi");

  this.statsRegex = '([A-Za-z]+\\s*\\d{1}\\D*\\d{1})';
  this.nameRegex = '[A-Za-z]+';
  this.scoreRegex = '\\d{1}\\D*\\d{1}$';
  this.pointsEarnedRegex = '\\d{1}';
  this.pointsGivenRegex = '\\d{1}$';
  this.dateRegex;
  this.dateDayRegex = '[\-]{1}([\\d]{2})[T]{1}';
  this.dateMonthRegex = '[\-]{1}([\\d]{2})[\-]{1}';
  this.dateYearRegex = '[\\d]{4}';
};


scytalia.prototype.startThinking = function () {
  setTimeout(postMessage,3000);
};

scytalia.prototype.respond = function() {
  startThinking();
//   return;
  if (this.req==undefined) {
    console.log('undefined');
    this.botResponse = 'undefined';
    return;
  }
  var request = JSON.parse(this.req.chunks[0]);
  this.botResponse = request;
  if (request.text && request.text.match(commandsRegex)) {
    if (request.name) 
      respondTo = request.name;
    else
      respondTo = 'whoever you are';
    this.res.writeHead(200);
    messageCheck(request.text);
    this.res.end();
  } else {
  //  console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
};

scytalia.prototype.responseTest = function(imaginaryMessage) {
  if (commandsRegex.test(imaginaryMessage))
    messageCheck(imaginaryMessage);
};

scytalia.prototype.postMessage = function() {
  var options, body, botReq;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };
  console.log(('sending ' + botResponse + ' to ' + botID).green);
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
  if (debugging)
    return;
  botReq.end(JSON.stringify(body));
}
 
scytalia.prototype.messageCheck = function(message) {
  var command = message.match(commandsRegex)[0];
  var argument = message.match(commandsRegex)[2];
  console.log('Command:'+command);
  console.log('Argument:'+argument);
  scytalia[command](argument,message);
  startThinking();
}

scytalia.prototype.cool = function(arguments) {
  botResponse = cool();
};

scytalia.prototype.scores = function(argument, theMessage) {

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
            botResponse = 'Scores added!';
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
            botResponse = 'Scores undone!';
        });
      });
    });
  };
  // command referenced functions
  // add scores
  scytalia.scores.add = function() {
    botResponse = 'Adding scores! I think...';
    addScores(parseForScores(theMessage));
  };
  // undo scores
  scytalia.scores.undo = function() {
    botResponse = 'fix your own mistakes';
    undoScores();
  };
  if (argument)
    scytalia.scores[argument]();
  else
    botResponse = 'What about the scores '+respondTo+'?';
};

scytalia.prototype.suck = function(arguments, theMessage) {
    if (respondTo!='Alex Oberg'|'Alex')
      return;
    scytalia.suck.my = function() {
      botResponse = 'yeah suck '+respondTo+'\'s dick!';
    };
    if (argument)
      scytalia.suck[argument]();
    else
      botResponse = 'What about sucking '+respondTo+'\'s dick?';
};
  

exports.scytalia = scytalia;
//exports.respond = scytalia.respond;
//exports.responseTest = scytalia.responseTest;
