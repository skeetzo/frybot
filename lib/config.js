var config = {};

// Commands, Arguments, & Regex 
var commands = [
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
  "next"
];
var commandsRegex = "(\/"+commands.join("|\/")+")?("+arguments.join("|")+")?";
config.commandsRegex = new RegExp(commandsRegex, "gi");
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
config.responding = true;
config.responseTime = 6000;
config.brainfart = 10000;

// Debugging sets personality switch
config.debugging = true;
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

module.exports = config;