var cool = require('cool-ascii-faces');
var HTTPS = require('https');
var Spreadsheet = require('edit-google-spreadsheet');
var commands = require('./commands.js');
require('dotenv').load();
require("colors");

var debugging = true;

var botID = process.env.BOT_ID;
if (debugging)
  botID = 6;
var defaultResponse = "burrito";

function respond() {
  if (this.req == undefined) {
    defaultResponse = 'undefined';
    return;
  }
  if (this.req == null) {
    defaultResponse = 'null';
    return;
  }
  if (this.req.chunks == undefined) {
    defaultResponse = 'undefined chunks';
    return;
  }
  if (this.req.chunks == null) {
    defaultResponse = 'null chunks';
    return;
  }
  var request = JSON.parse(this.req.chunks[0]);

  postMessage(request);
  return;
  // request.text.match(codes.commandsRegex)
  if (request.text && commands.exists(request.text)) {
    console.log(JSON.stringify(request));
    return;
    // grab all response info
    var command = function() {
      this.message = request.text,
      this.sender = request.name
    };

    commands.activate(command());

    this.res.writeHead(200);
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
 


function test() {};

exports.respond = respond;
exports.postMessage = postMessage;
exports.test = test;
