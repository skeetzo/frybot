var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    Location = require('../models/location'),
    Match = require('../models/match'),
    Team = require('../models/team'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Match Schema
var matchUpSchema = new Schema({
  date: { type: Date, default: moment().format('MM/DD/YYYY') },
  location: { type: String, default: config.homeLocation },
  teamOne: { type: String, default: '' },
  teamTwo: { type: String, default: '' },
  matchupNum: { type: Number, default: 0 },
  // teams: { type: Array, default: [(new Team()),(new Team())] },
  matches: { type: Array, default: [] },
},options);

matchUpSchema.pre('save', function(next) {
  logger.debug('matchup saved: %s vs %s (%s)',this.teamOne,this.teamTwo,this.date);
  next();
});

matchUpSchema.method.updateMatches = function(matches, callback) {
  var self = this;
  for (var i=0;i<self.matches.length;i++) 
    for (var j=0;j<matches.length;j++) {
    if (self.matches[i].playerOne==matches[j].name||self.matches[i].playerTwo==matches[j].name) {
      self.matches[i].playerOnePointsEarned = matches[j].pointsEarned;
      self.matches[i].playerOnePointsGiven = matches[j].pointsGiven;
      self.matches[i].playerOnePointsEarned = matches[j].pointsEarned;

    }
  }
  self.save(function(err) {
    if (err) return callback(err);
    callback(null);
  })
}


matchUpSchema.statics.findOneAndUpdateMatches = function(matches, callback) {
  this.findOne({'date':matches[0].matchDate}, function (err, matchup) {
    if (err) return callback(err);
    if (!matchup) matchup = new Matchup(matchup);
    var finish = function() {
      matchup.save(function(err) {
        if (err) logger.warn(err);
        callback(null, matchup);
      });
    }
    var finished = setTimeout(finish,3000);
    _.forEach(matches,function (match) {
      Match.findOne({'matchDate':match.matchDate,'playerOne':match.players[0]},function (err, match_) {
        if (err) return logger.warn(err);
        if (!match_) match_ = new Match({'playerOne':match.players[0],'matchDate':match.matchDate});
        match_.playerOnePointsEarned = match.pointsEarned;
        match_.playerOnePointsGiven = match.pointsGiven;
        match_.save(function(err) {
          if (err) logger.warn(err);
          matchup.matches.push(match_);
          clearTimeout(finished);
          finished = setTimeout(finish,3000);
        });
      });
    });
  });
}

var Matchup = mongoose.model('matchups', matchUpSchema,'matchups');
module.exports = Matchup;