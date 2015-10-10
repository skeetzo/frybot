var config = require('./config.js');

var cool = require('cool-ascii-faces');
var HTTPS = require('https');
var Spreadsheet = require('edit-google-spreadsheet');
var commands = require('./commands.js');
require("colors");

// GroupMe API
var GroupMe_API = require('groupme').Stateless;
var GroupMe_AccessToken = config.GroupMe_AccessToken;
var ItIsWhatItIs_GroupMeID = config.ItIsWhatItIs_GroupMeID;

var debugging = false;
var responding = true;

var botID = config.botID;
if (debugging)
  botID = 6;
var defaultResponse = "burrito";

// bottle number needs to be saved somewhere or else remembered while it's on for weeks at a time?
// update .env variable?

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
  if (request.name == 'Scytalia')
    return;
  if (request.text && request.name && commands.matches(request.text)) {
    if (request.name)
      commands.activate(request.text,request.name);
    else
      commands.activate(request.text);
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
  var caughtThoughts = thoughts;
  thoughts = [];
  if (!responding)
    return;
  if (caughtThoughts.length>=1)
    postMessage(caughtThoughts.join(' '));
  else if (caughtThoughts.length>0)
    postMessage(caughtThoughts.join('.. '));
};

// Helper function to construct the the source_guid string.
function generateGUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (a) {
        var b, c;
        return b = Math.random() * 16 | 0, c = a === "x" ? b : b & 3 | 8, c.toString(16);
    });
};

function postMessage(message) {
  var options, body, botReq;
  // opts.message.source_guid
  var guid = generateGUID();
  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };
  body = {
    "bot_id" : botID,
    "text" : message,
    "source_guid": guid
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

// implementation intent is for liked messages to confirm receivement of commands
function likeMessage(message_id) {GroupMe_API.Likes.create(GroupMe_AccessToken, ItIsWhatItIs_GroupMeID,message_id, function(err,ret) {});};

function bottleReminder() {
  commands.bottleDuty();
};

function readyChecker() {
  commands.activate("/ready check",config.name);
};

function poke() {
  think();
};

function test(testMessage) {
  commands.activate("/ready check","Alex O");
};

exports.respond = respond;
exports.postMessage = postMessage;
exports.addThought = addThought;
exports.bottleReminder = bottleReminder;
exports.readyChecker = readyChecker;
exports.test = test;
