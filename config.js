var config = {};

// Commands, Arguments, & Regex 
var commands = [
  'coolguy',
  'scores',
  'suck',
  'bottle',
  'jk'
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
  "update"
];
var commandsRegex = "(\/"+commands.join("|\/")+")?("+arguments.join("|")+")?";
config.commandsRegex = new RegExp(commandsRegex, "gi");
// Google
config.Frybot_Google_ServiceEmail = process.env.Frybot_Google_ServiceEmail;
config.Frybot_Google_key = process.env.Frybot_Google_key;
// It Is What It Is Google Sheet
config.ItIsWhatItIs_Spreadsheet_ID = process.env.ItIsWhatItIs_Spreadsheet_ID;
config.ItIsWhatItIs_statsSheetID = 'ot3ufy3';
config.ItIsWhatItIs_frybotSheetID = 'om5ojbr';
// GroupMe API
config.GroupMe_AccessToken = process.env.GroupMe_AccessToken;
// Misc
config.port = 3000;
config.responding = true;
config.responseTime = 6000;
config.brainfart = 10000;

// Debugging sets personality switch
config.debugging = true;
if (!config.debugging) {
  config.name = "Frybot";
  config.GroupMe_group_ID = process.env.Frybot_GroupMe_Group_ID;
  config.botID = process.env.Frybot_GroupMe_bot_ID;
}
else {
  config.name = "Naivi";
  config.GroupMeID = process.env.Naivi_GroupMe_Group_ID;
  config.botID = process.env.Naivi_GroupMe_bot_ID;
}

module.exports = config;
