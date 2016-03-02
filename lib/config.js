<<<<<<< HEAD
var config = {};

// Commands, Arguments, & Regex 
var commands = [
=======
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
var config = {};

config.events = events;
// Commands, Arguments, & Regex 
var commands = [
  'fuck',
>>>>>>> 297b2e504e580156a7cf805d781a5cd06addfc95
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
<<<<<<< HEAD
  "next"
=======
  "next",
  "you",
  "me",
  "off"
>>>>>>> 297b2e504e580156a7cf805d781a5cd06addfc95
];
var commandsRegex = "(\/"+commands.join("|\/")+")?("+arguments.join("|")+")?";
config.commandsRegex = new RegExp(commandsRegex, "gi");

<<<<<<< HEAD

// Amazon S3
config.AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
config.AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
config.S3_BUCKET = process.env.S3_BUCKET;
// Google
config.Frybot_Google_ServiceEmail = process.env.Frybot_Google_ServiceEmail;
config.Frybot_Google_key = process.env.Frybot_Google_key;
// It Is What It Is Google Sheet
config.ItIsWhatItIs_Spreadsheet_ID = process.env.ItIsWhatItIs_Spreadsheet_ID;
config.ItIsWhatItIs_statsSheetID = 'ot3ufy3';
config.ItIsWhatItIs_nicofactsSheetID = 'om5ojbr';
config.ItIsWhatItIs_referencesSheetID = 'ofz9sxs';
// GroupMe API
config.GroupMe_AccessToken = process.env.GroupMe_AccessToken;
// Misc
config.port = Number(process.env.PORT || 3000);
=======
// Debugging sets personality switch
config.debugging = false;
config.testing = false;
config.localLoad = false;
config.localSave = false;

// Misc
config.port = Number(process.env.PORT || Math.random()*4000);
>>>>>>> 297b2e504e580156a7cf805d781a5cd06addfc95
config.responding = true;
config.responseTime = 6000;
config.brainfart = 10000;

<<<<<<< HEAD
// Debugging sets personality switch
config.debugging = false;
config.localLoad = false;
config.localSave = false;
if (!config.debugging) {
  config.name = "Frybot";
  config.GroupMe_group_ID = process.env.Frybot_GroupMe_Group_ID;
  config.botID = process.env.Frybot_GroupMe_bot_ID;
  config.GroupMe_group_name = '#ItIs!WhatItIs!';
}
else {
  config.name = "Naivi";
  config.GroupMeID = process.env.Naivi_GroupMe_Group_ID;
  config.botID = process.env.Naivi_GroupMe_bot_ID;
  config.GroupMe_group_name = 'Talking to Myself';
}

config.players_ = [
  {name: 'Oberg'},
  {name: 'Nico'},
  {name: 'Danny'},
  {name: 'George'},
  {name: 'Gabe'},
  {name: 'Civi'},
  {name: 'Mike'}
];
=======
var localConfig = {};
fs.readFile('./lib/localConfig.json', function read(err, data) {
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

>>>>>>> 297b2e504e580156a7cf805d781a5cd06addfc95

module.exports = config;