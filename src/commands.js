var _ = require('underscore'),
    aws = require('aws-sdk'),
    cool = require('cool-ascii-faces'),
    fs = require('fs'),
    GroupMe_API = require('groupme').Stateless,
    HTTPS = require('https'),
    League = require('./league.js').League,
    moment = require ('moment'),
    Spreadsheet = require('edit-google-spreadsheet');

var localTeamShitPath = './dev/teamshit.json',
    localSeasonsPath = './dev/seasons.json',
    teamshitData = {};

var lastMatchNum_ = 0;

/*
  Commands
*/

/*
  Commands available, called via activate
*/
var commands = {
  /**
  * Filter function activates the command process to be run
  * @param {Object} request - the request as passed from bot.post(), includes text and id
  * @param {function} callback - the method used to return any messages regarding success/failure
  */
  
  loadModules : function() {
    var self = this;
    // var modules = self.config.commands;
    self.commands.scores = require('./cmds/scores.js');
    self.commands.bottle = require('./cmds/bottle.js');
    self.commands.fuck = require('./cmds/fuck.js');
    self.commands.nicofacts = require('./cmds/nicofacts.js');
    self.commands.season = require('./cmds/season.js');
    self.commands.suck = require('./cmds/suck.js');
  },

  // module.exports.activate = activate;

  /*
    Loads the necessary league data
  */
  load : function(callback) {
    var self = this;
    var seasons;
    self.logger.debug('Loading Team Shit');
    if (!self.config.localLoad)
      self.s3.getObject({Bucket:self.config.S3_BUCKET,Key:self.config.AWS_SECRET_KEY}, function(err, data) {
        if (err) return callback(err);
        teamshitData = JSON.parse(data.Body.toString()).teamshitData;
        seasons = JSON.parse(data.Body.toString()).seasons;
        // console.log('team shit: '+JSON.stringify(teamshitData));
        self.logger.debug('Team Shit Loaded: s3');
        onLoad();
      });
    else {
      fs.readFile(localTeamShitPath, function read(err, data) {
        if (err) return callback(new Error('Local teamshit Not Found'));
        teamshitData = JSON.parse(data);
        self.logger.debug('Team Shit Loaded: local');
      });
      fs.readFile(localSeasonsPath, function read(err, data) {
        if (err) return callback(new Error('Local seasons Not Found'));
        seasons = JSON.parse(data).seasons;
        self.logger.debug('Seasons Loaded: local');
        onLoad();
      });
    }
    function onLoad() {
      self.bottleBitches = teamshitData.bottleBitches;
      self.league = new League(seasons, function(err) {
        if (err) return callback(err);
        setTimeout(function slightDelay() {
          callback(null);
          if (self.config.saveOnLoad) self.saveTeamShitData();
        },2000);
      });
    }
  },

  // module.exports.load = load;

  /*
    Saves the team shit data
  */
  saveTeamShitData : function() {
    var self = this;
    if (!self.config.saving) return console.debug("Not saving.");
    teamshitData.bottleBitches = this.bottleBitches || teamshitData.bottleBitches || [];
    
    if (!self.config.localSave) {
      self.logger.debug('Saving Data to S3');
      var data = {
            seasons: this.league.seasons,
            teamshitData: teamshitData
          },
          s3_params = {
            Bucket: self.config.S3_BUCKET,
            Key: self.config.AWS_SECRET_KEY,
            ACL: 'public-read-write',
            Body: JSON.stringify(data),
            ContentType: 'application/json',
          };
      self.s3.putObject(s3_params, function(err, data) {
        if (err) return self.logger.debug(err);
        self.logger.debug('Data Saved to S3');
      });
    }
    else {
      self.logger.debug('Saving Team Shit Locally');
      fs.writeFile(localTeamShitPath, JSON.stringify(teamshitData,null,4), function (err) {
        if (err) return self.logger.debug(err);
        self.logger.debug('Team Shit (local) Saved');
      });
      fs.writeFile(localSeasonsPath, JSON.stringify({seasons:this.league.seasons},null,4), function (err) {
        if (err) return self.logger.debug(err);
        self.logger.debug('Seasons (local) Saved');
      });
    }
  },

  // module.exports.saveTeamShitData = saveTeamShitData;

  bottle : function() {
    // this.commands.bottle = require('./src/cmds/bottle.js');
  },


  // Runs the cool guy thing
  coolguy : function(data, callback) {
    this.say(cool());
  },

  dickeater : function(data, callback) {
    if (!this.dickeaterQuota) this.dickeaterQuota = 0;
    if (this.dickeaterQuota%4!=0)
      callback(null,"- said the all time eater of dicks");
    this.dickeaterQuota++;
  },

  

  scores : function() {
    // this.commands.scores = require('./src/cmds/scores.js');
  },


  fuck : function(data, callback) {
    // moved to fuck
  },

  season : function() {
    // separate
  },

  nicofacts : function() {
    // separate
  },


  updateAWS : function() {
    aws.config.update({accessKeyId: this.config.AWS_ACCESS_KEY, secretAccessKey: this.config.AWS_SECRET_KEY});
    this.s3 = new aws.S3();
  }
}

// module.exports.activate = commands.activate;
module.exports = commands;
// module.exports.activate = commands.activate;
// module.exports.load = commands.load;

/**
* Likes the message with the given id
* @param {string} message_id - The message's id
*/
function likeMessage_(message_id) {GroupMe_API.Likes.create(config.GroupMe_AccessToken, config.GroupMe_group_ID, message_id, function(err,ret) {});};

module.exports.likeMessage = likeMessage_;

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}
