var _ = require('underscore'),
    aws = require('aws-sdk'),
    cool = require('cool-ascii-faces'),
    fs = require('fs'),
    GroupMe_API = require('groupme').Stateless,
    HTTPS = require('https'),
    League = require('./league.js').League,
    moment = require ('moment'),
    Spreadsheet = require('edit-google-spreadsheet');


var lastMatchNum_ = 0;

/*
  Commands
*/

/*
  Cool Guy
*/
module.exports.coolguy = function(data, callback) {
  this.say(cool());
}

/*
  Likes the message with the given id
  @param {string} message_id - The message's id
*/
module.exports.likeMessage = function(message_id) {GroupMe_API.Likes.create(this.config.GroupMe_AccessToken, this.config.GroupMe_group_ID, message_id, function(err,ret) {})};

/*
  Loads the necessary league data
*/
module.exports.loadLeague = function(callback) {
  var self = this;
  var seasons;
  self.logger.debug('Loading Team Shit');
  if (!self.config.localLoad)
    self.s3.getObject({Bucket:self.config.S3_BUCKET,Key:self.config.AWS_SECRET_KEY}, function(err, data) {
      if (err) return callback(err);
      self.teamshitData = JSON.parse(data.Body.toString()).teamshitData;
      seasons = JSON.parse(data.Body.toString()).seasons;
      // console.log('team shit: '+JSON.stringify(teamshitData));
      self.logger.debug('Team Shit Loaded: s3');
      onLoad();
    });
  else {
    fs.readFile(self.config.localTeamShitPath, function read(err, data) {
      if (err) return callback(new Error('Local teamshit Not Found'));
      self.teamshitData = JSON.parse(data);
      self.logger.debug('Team Shit Loaded: local');
    });
    fs.readFile(self.config.localSeasonsPath, function read(err, data) {
      if (err) return callback(new Error('Local seasons Not Found'));
      seasons = JSON.parse(data).seasons;
      self.logger.debug('Seasons Loaded: local');
      onLoad();
    });
  }
  function onLoad() {
    self.bottleBitches = self.teamshitData.bottleBitches;
    self.league = new League(seasons, function(err) {
      if (err) return callback(err);
      setTimeout(function slightDelay() {
        callback(null);
        if (self.config.saveOnLoad) self.commands.saveTeamShitData.call(self);
      },2000);
    });
  }
}

/*
  Saves the team shit data
*/
module.exports.saveTeamShitData = function() {
  var self = this;
  if (!self.config.saving) return self.logger.debug("Not saving.");
  self.teamshitData.bottleBitches = this.bottleBitches || self.teamshitData.bottleBitches || [];
  
  if (!self.config.localSave) {
    self.logger.debug('Saving Data to S3');
    var data = {
          seasons: this.league.seasons,
          teamshitData: self.teamshitData
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
    fs.writeFile(self.config.localTeamShitPath, JSON.stringify(self.teamshitData,null,4), function (err) {
      if (err) return self.logger.debug(err);
      self.logger.debug('Team Shit (local) Saved');
    });
    fs.writeFile(self.config.localSeasonsPath, JSON.stringify({seasons:this.league.seasons},null,4), function (err) {
      if (err) return self.logger.debug(err);
      self.logger.debug('Seasons (local) Saved');
    });
  }
}

/*
  Dickeater
*/
module.exports.dickeater = function(data, callback) {
  if (!this.dickeaterQuota) this.dickeaterQuota = 0;
  if (this.dickeaterQuota%4!=0)
    callback(null,"- said the all time eater of dicks");
  this.dickeaterQuota++;
}

/*
  Update AWS
*/
module.exports.updateAWS = function() {
  aws.config.update({accessKeyId: this.config.AWS_ACCESS_KEY, secretAccessKey: this.config.AWS_SECRET_KEY});
  this.s3 = new aws.S3();
}



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
