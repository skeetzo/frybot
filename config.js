var config = {};

config.debugging = true;

config.NAME = "Scytalia";
config.PORT = 3000;
config.botID = "219f82d5b599637927f208bb61";
config.responding = true;

if (config.debugging)
  config.botID = 6;

// Google
config.ItIsWhatItIs_serviceEmail = "615638101068-ddthvbjttd2076flaqi1rm54divhpqvk@developer.gserviceaccount.com";
config.ItIsWhatItIs_keyFile = 'secret.pem';
config.ItIsWhatItIs_SpreadsheetName = 'It Is What It Is Tracker';
config.ItIsWhatItIs_SpreadsheetID = '1AlMc7BtyOkSbnHQ8nP6G6PqU19ZBEQ0G5Fmkb4OsT08';
    // scores
config.ItIsWhatItIs_statsSheetName = 'Current Season Stats';
config.ItIsWhatItIs_statsSheetID = 'ot3ufy3';
config.ItIsWhatItIs_frybotSheetName = 'frybot';
config.ItIsWhatItIs_frybotSheetID = 'om5ojbr';

// GroupMe API
config.GroupMe_AccessToken = "2f738e5005bc0133e1287ef6bffc9e1d";
config.ItIsWhatItIs_GroupMeID = "7054026";
config.Scytalia_GroupMeID = "14734775";

module.exports = config;