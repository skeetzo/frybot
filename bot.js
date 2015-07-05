var codes = require('./codes.js');
var cool = require('cool-ascii-faces');
var HTTPS = require('https');
var Spreadsheet = require('edit-google-spreadsheet');
var superpowers = require('./superpowers.js');
require('dotenv').load();
require("colors");


var debugging = true;

// add a bot thought process tree on an interval that gets cleared upon final function success / fail

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

var botID = process.env.BOT_ID;
if (debugging)
  botID = 6;
var botResponse = "burrito";
var respondTo;

var commands = [
        'cool',
        'scores',
        'suck'
  ];
var commandsArguments = ["add","undo","my"];
var commandsRegex = "([\/]{1}"+commands.join("|")+")?("+commandsArguments.join("|")+")?";
commandsRegex = new RegExp(commandsRegex, "gi");
//commandsRegex = codes.

function respond() {
  if (this.req == undefined) {
    botResponse = 'undefined';
    return;
  }
  if (this.req == null) {
    botResponse = 'null';
    return;
  }
  if (this.req.chunks == undefined) {
    botResponse = 'undefined chunks';
    return;
  }
  if (this.req.chunks == null) {
    botResponse = 'null chunks';
    return;
  }
  var request = JSON.parse(this.req.chunks[0]);

  postMessage(request);
  return;
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

function responseTest() {
//  if (commandsRegex.test(imaginaryMessage))
 //   messageCheck(imaginaryMessage);
   var testMessage =  '/scores add Coco 2:0 Mike 3:0 Oberg 3:0 Danny 3:0 Civi 3:0';
messageCheck(testMessage);
};

function postMessage(message) {
  var options, body, botReq;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : message
  };
  console.log(('sending ' + message + ' to ' + botID).green);
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
};
 
function messageCheck(message) {
  var command = message.match(commandsRegex)[0];
  var argument = message.match(commandsRegex)[2];
  // do message - command - argument
  console.log('Command:'+command);
  console.log('Argument:'+argument);
  superpowers.availablePowers(command,argument,message);
};

function test() {};

exports.respond = respond;
exports.postMessage = postMessage;
exports.test = test;
