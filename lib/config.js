var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
var config = {};

config.events = events;
// Commands, Arguments, & Regex 
var commands = [
  'fuck',
  'coolguy',
  'scores',
  'suck',
  'bottle',
  'jk',
  'nicofacts'
];
var arguments = [
  "add",
  "undo",
  "my",
  "his",
  "duty",
  "who",
  "what",
  "mvp",
  "lvp",
  "callouts",
  "of",
  "update",
  "FUCKOFF",
  "YES",
  "NO",
  "START",
  "next",
  "you",
  "me",
  "off"
];
var commandsRegex = "(\/"+commands.join("|\/")+")?("+arguments.join("|")+")?";
config.commandsRegex = new RegExp(commandsRegex, "gi");

// Debugging sets personality switch
config.debugging = true;
config.debugging_League = true;

config.testing = false;
config.localLoad = false;
config.localSave = false;

// Misc

process.on('uncaughtException', function(err) {
  if (err==='listen EACCES') {
    console.log('adjusting port...');
    config.port = Number(process.env.PORT || Math.random()*3000);
  }
});

config.port = Number(process.env.PORT || Math.random()*4000);
config.responding = true;
config.responseTime = 6000;
config.brainfart = 10000;

var localConfig = {};
fs.readFile('./localConfig.json', function read(err, data) {
  if (err)
    console.log('Local Config Not Found; Loading env setup');
  else {
    localConfig = JSON.parse(data);
    console.log('Local Config Loaded');
  }
  setup();
});

function setup() {
  // Amazon S3
  config.AWS_ACCESS_KEY = localConfig.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY;
  config.AWS_SECRET_KEY = localConfig.AWS_SECRET_KEY || process.env.AWS_SECRET_KEY;
  config.S3_BUCKET = localConfig.S3_BUCKET || process.env.S3_BUCKET;
  // Google
  config.Google_service_email = localConfig.Google_service_email || process.env.Google_service_email;
  config.Google_keyFile = localConfig.Google_keyFile || process.env.Google_keyFile;
  config.Google_key = process.env.Google_key;
  config.Google_Oauth_Opts = {
      "email": config.Google_service_email,
      "key": config.Google_key,
      "keyFile": config.Google_keyFile
  };
  // It Is What It Is Google Sheet
  config.Google_ItIsWhatItIs_Spreadsheet_ID = localConfig.Google_ItIsWhatItIs_Spreadsheet_ID || process.env.Google_ItIsWhatItIs_Spreadsheet_ID;
  config.ItIsWhatItIs_statsSheetID = 'ot3ufy3';
  config.ItIsWhatItIs_nicofactsSheetID = 'om5ojbr';
  config.ItIsWhatItIs_referencesSheetID = 'ofz9sxs';
  // GroupMe API
  config.GroupMe_AccessToken = localConfig.GroupMe_AccessToken || process.env.GroupMe_AccessToken;

  if (!config.debugging) {
    config.name = "Frybot";
    config.GroupMe_group_ID = localConfig.Frybot_GroupMe_group_ID  || process.env.GroupMe_Group_ID;
    config.botID = localConfig.Frybot_botID || process.env.GroupMe_bot_ID;
    config.GroupMe_group_name = '#ItIs!WhatItIs!';
  }
  else {
    config.name = "Naivi";
    config.GroupMe_group_ID = localConfig.Naivi_GroupMe_group_ID || process.env.GroupMe_Group_ID;
    config.botID = localConfig.Naivi_botID || process.env.GroupMe_bot_ID;
    config.GroupMe_group_name = 'Talking to Myself';
  }
  console.log('Config Created: '+config.name);
  config.events.emit('config loaded');
}


module.exports = config;