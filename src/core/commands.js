var _ = require('underscore'),
    Season = require('../models/season'),
    cool = require('cool-ascii-faces'),
    fs = require('fs'),
    GroupMe_API = require('groupme').Stateless,
    HTTPS = require('https'),
    League = require('./league.js').League,
    NicoFact = require('../models/nicofact'),
    config = require('../config/index'),
    logger = config.logger,
    moment = require ('moment');

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
module.exports.likeMessage = function(message_id) {GroupMe_API.Likes.create(config.GroupMe_AccessToken, config.GroupMe_group_ID, message_id, function(err,ret) {})};

/*
  Loads the necessary league data
*/
module.exports.loadLeague = function(callback) {
  var self = this;
  logger.debug('Loading Team Shit');  

  if (config.localLoad) {
    fs.readFile(config.localTeamShitPath, function read(err, data) {
      if (err) return callback(new Error('Local teamshit Not Found'));
      self.teamshitData = JSON.parse(data);
      logger.debug('Team Shit Loaded: local');
    });
    fs.readFile(config.localSeasonsPath, function read(err, data) {
      if (err) return callback(new Error('Local seasons Not Found'));
      logger.debug('Seasons Loaded: local');
      onLoad(JSON.parse(data).seasons);
    });
  }
  else {
    Season.find({},function (err, seasons) {
      if (err) logger.warn(err);
      if (!seasons||seasons.length==0) {
        logger.log('starting new season');
        var newSeason = new Season();
        return newSeason.save(function (err) {
          if (err) logger.warn(err);
          seasons = [newSeason];
          onLoad(seasons);
        })
      }
      else
        logger.log('seasons found: %s',JSON.stringify(seasons));
      onLoad(seasons);
    });
  }



  function onLoad(seasons) {
    self.league = new League(seasons);
    callback(null);
  }
}

/*
  Saves the team shit data
*/
module.exports.saveTeamShitData = function() {
  var self = this;
  if (!config.saving) return logger.debug("Not saving.");
  self.teamshitData.bottleBitches = this.bottleBitches || self.teamshitData.bottleBitches || [];
  
  if (config.localSave) {
    logger.debug('Saving Team Shit Locally');
    fs.writeFile(config.localTeamShitPath, JSON.stringify(self.teamshitData,null,4), function (err) {
      if (err) return logger.debug(err);
      logger.debug('Team Shit (local) Saved');
    });
    fs.writeFile(config.localSeasonsPath, JSON.stringify({seasons:this.league.seasons},null,4), function (err) {
      if (err) return logger.debug(err);
      logger.debug('Seasons (local) Saved');
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


module.exports.getAllNicoFacts = function(callback) {
  var nicoFacts = [];
  var regex = new RegExp('Nico Fact #','gi');
  function repeat(before) {
    GroupMe_API.Messages.index(config.GroupMe_AccessToken, config.GroupMe_group_ID, {'before_id':before},
      function (err,ret) {
        if (err) {
          // logger.warn(err.message);
          logger.log('end of messages');
          logger.log('nicoFacts: %s',nicoFacts.length);
          return;
        }
        // logger.log(JSON.stringify(ret,null,4));
        // return;
        var lastMessage;
        for (var i=0;i<ret.messages.length;i++) {
          lastMessage = ret.messages[i].id; // last and oldest message in the array
          if (regex.test(ret.messages[i].text)&&!_.contains(nicoFacts,ret.messages[i].text)) {
            logger.log(ret.messages[i].text);
            nicoFacts.push(ret.messages[i].text);
            var number = null;
            try {
              number = ret.messages[i].text.match(/#([0-9]*)(:|\s|\.)/gi)[0].replace('#','').trim();
              number = number.toString().substring(0,number.toString().length-1);
            }
            catch (er) {
              number = -1;
            }
            var fact = ret.messages[i].text.substring(ret.messages[i].text.indexOf(':')+1).trim();
            // logger.debug('number: %s',number);
            var newFact = {
              'fact': fact,
              'number': number,
              'author': ret.messages[i].name,
              'like_count': ret.messages[i].favorited_by.length
            };
            NicoFact.findOneAndUpdate({'fact':fact}, newFact, {'upsert':true}, function (err) {
            // newFact.save(function(err) {
              if (err) logger.warn(err);
            });
          }
        }
        logger.log('searching...');
        if (lastMessage)
          repeat(lastMessage);
        else {
          logger.log('nicoFacts: %s',nicoFacts.length);
          return;
        }
        // get message id of last one in array of messages
        // repeat until all messages are found
    })
  }
  repeat(null);
};
