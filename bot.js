require('dotenv').load();

var cool = require('cool-ascii-faces');
var HTTPS = require('https');
var Spreadsheet = require('edit-google-spreadsheet');
var commands = require('./commands.js');
require("colors");

// GroupMe API
const GROUPME_ACCESS_TOKEN = "2f738e5005bc0133e1287ef6bffc9e1d";
var GROUPME_API = require('groupme').Stateless;
var GROUPME_ItIsWhatItIs_ID = process.env.ItIsWhatItIs_ID;

var debugging = false;
var responding = true;

var botID = process.env.BOT_ID;
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
  if (!responding)
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

// implementation intent is for liked messages to confirm receivement of commands
function likeMessage(message_id) {GROUPME_API.Likes.create(GROUPME_ACCESS_TOKEN, GROUPME_ItIsWhatItIs_ID,message_id, function(err,ret) {});};

function bottleReminder() {
  commands.bottleDuty();
};

function poke() {
  think();
};

function test(testMessage) {
  postMessage(testMessage);
};

exports.respond = respond;
exports.postMessage = postMessage;
exports.addThought = addThought;
exports.bottleReminder = bottleReminder;
exports.test = test;
