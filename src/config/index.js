var crons = require('./crons.js'),
    keys = require('./keys.js'),
    logger = require('./logger.js');

var config = {};

config.local_keys_path = './dev/localKeys.json';
config.logger_log_path = './dev/file.log';
config.logger_stream_path = './dev/stream.log';
config.localTeamShitPath = './dev/teamshit.json';
config.localSeasonsPath = './dev/seasons.json';

// Debugging sets personality switch
config.debugging = true;
config.debugging_League = true;

config.testing = true;
config.saving = false;
config.saveOnLoad = false;
config.localLoad = true;
config.localSave = false;
config.cronjobbing = false;

// Twitter
config.Twitter_On = true;
config.tweeting = false;

config.botName = "Frybot";
if (config.debugging)
  config.botName = "Naivi";
config.port = Number(process.env.PORT || Math.random()*5000);
config.responding = true;
config.responseTime = 9000;
config.brainfart = 10000;

// Commands, Arguments, & Regex 
var commandsRegex = "\/[a-z]*",
    argumentsRegex = "\-[a-z]*";
config.commandsRegex = new RegExp(commandsRegex, "i");
config.argumentsRegex = new RegExp(argumentsRegex, "i");


logger.call(config);
crons.call(config);
keys.call(config);

module.exports = config;
