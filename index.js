var http, director, cool, bot, router, server, port;

http        = require('http');
director    = require('director');
cool        = require('cool-ascii-faces');
var Spreadsheet = require('edit-google-spreadsheet');
require('dotenv').load();
require("colors");
//bot         = require('./bot.js');
var debugging = false;

var request;

//var scytalia = new bot.scytalia();
var scytalia = new scytalia();



router = new director.http.Router({
  '/' : {
    post: scytalia.respond,
    get: ping
  }
});

server = http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });

  router.dispatch(req, res, function(err) {
    res.writeHead(err.status, {"Content-Type": "text/plain"});
    res.end(err.message);
  });
});

port = Number(process.env.PORT || 5000);
server.listen(port);

function ping() {
  this.res.writeHead(200);
//  var that = JSON.stringify(request);
  this.res.end("Hi, I'm scytalia. And I totally work."+this.req.toString());
}




function scytalia() {
  var botID = process.env.BOT_ID;
  if (debugging)
    botID = 6;
  var botResponse = "burrito";
  var respondTo;

  var startThinking = function () {
    setTimeout(postMessage,3000);
  };

  var commands = [
          'cool',
          'scores',
          'suck'
    ];
  var comandsArguments = ["add","undo","my"];
  var commandsRegex = "([//]{1}"+commands.join("|")+")?("+comandsArguments.join("|")+")?";
  commandsRegex = new RegExp(commandsRegex, "gi");

  scytalia.respond = function () {
    startThinking();
    botResponse = 'nuh uh';
    return;
    var request = JSON.parse(req.chunks[0]);
    if (request.text)
      botResponse = request.text;
    else
      botResponse = 'nope';

    if (request.text && request.text.match(commandsRegex)) {
      if (request.name) 
        respondTo = request.name;
      else
        respondTo = 'whoever you are';
      res.writeHead(200);
      messageCheck(request.text);
      res.end();
    } else {
    //  console.log("don't care");
      res.writeHead(200);
      res.end();
    }

  };

  this.responseTest = function(imaginaryMessage) {
    if (commandsRegex.test(imaginaryMessage))
      messageCheck(imaginaryMessage);
  };

  function postMessage() {
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
   
  function messageCheck(message) {
    var command = message.match(commandsRegex)[0];
    var argument = message.match(commandsRegex)[2];
    console.log('Command:'+command);
    console.log('Argument:'+argument);
    scytalia[command](argument,message);
  //  startThinking();
  }

  //         messageRegexes
  //function botCommand(command) {
  //  if (command=='/scores')
   //   addStats();
 // };
//
  var statsRegex = '([A-Za-z]+\\s*\\d{1}\\D*\\d{1})';
  var nameRegex = '[A-Za-z]+';
  var scoreRegex = '\\d{1}\\D*\\d{1}$';
  var pointsEarnedRegex = '\\d{1}';
  var pointsGivenRegex = '\\d{1}$';
  var dateRegex;
  var dateDayRegex = '[\-]{1}([\\d]{2})[T]{1}';
  var dateMonthRegex = '[\-]{1}([\\d]{2})[\-]{1}';
  var dateYearRegex = '[\\d]{4}';

  var moment = require ('moment');

  scytalia.cool = function(arguments) {
    botResponse = cool();
  };

  scytalia.scores = function(argument, theMessage) {

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
    }
    if (argument)
      scytalia.scores[argument]();
    else
      botResponse = 'What about the scores '+respondTo+'?';
  };

  scytalia.suck = function(arguments, theMessage) {
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
  


};
