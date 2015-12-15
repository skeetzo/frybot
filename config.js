var config = {};

// botID
var Frybot_botID = "219f82d5b599637927f208bb61";
var Scytalia_botID = "6c15e36d3a1ac9b72b3cd3049d";
config.botID = Scytalia_botID;
// Commands, Arguments, & Regex 
var commands = [
  'coolguy',
  'scores',
  'suck',
  'bottle'
];
var arguments = [
  "add",
  "undo",
  "my",
  "his",
  "duty",
  "who",
  "what"
];
var commandsRegex = "(\/"+commands.join("|\/")+")?("+arguments.join("|")+")?";
config.commandsRegex = new RegExp(commandsRegex, "gi");
// Debugging
config.debugging = false;
// ItIsWhatItIs
config.ItIsWhatItIs_statsSheetName = 'Current Season Stats';
config.ItIsWhatItIs_statsSheetID = 'ot3ufy3';
config.ItIsWhatItIs_frybotSheetName = 'frybot';
config.ItIsWhatItIs_frybotSheetID = 'om5ojbr';
// Google
config.ItIsWhatItIs_serviceEmail = "615638101068-ddthvbjttd2076flaqi1rm54divhpqvk@developer.gserviceaccount.com";
config.ItIsWhatItIs_keyFile = 'secret.pem';
config.ItIsWhatItIs_SpreadsheetName = 'It Is What It Is Tracker';
config.ItIsWhatItIs_SpreadsheetID = '1AlMc7BtyOkSbnHQ8nP6G6PqU19ZBEQ0G5Fmkb4OsT08';
// GroupMe API
config.GroupMe_AccessToken = "2f738e5005bc0133e1287ef6bffc9e1d";
var Scytalia_GroupMeID = "14734775";
var Frybot_GroupMeID = "7054026";
config.GroupMeID = Scytalia_GroupMeID;
// Misc
config.NAME = "Scytalia";
config.PORT = 3000;
config.responding = true;
config.responseTime = 6000;
config.brainfart = 10000;

module.exports = config;