var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    Season = require('../models/season.js'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Match Schema
var leagueSchema = new Schema({
  name: { type: String, default: 'APA League' },
  division: { type: String, default: 'Division Red' },
  seasons: { type: Array },
  players: { type: Array },
  teams: { type: Array },
  locations: { type: Array, default: [] },

},options);

leagueSchema.pre('save', function(next) { 
  var self = this;
  logger.debug('league saved: %s',this.name);

  if (!this.seasons) {
    logger.debug('league- no seasons found');

    this.seasons = [new Season()];
  }
  if (!this.teams) {
    logger.debug('league- updating teams');
    this.teams = _.pluck(this.seasons,'teams');
  }
  if (!this.players) {
    logger.debug('league- updating players');
    this.players = [];
    _.forEach(self.teams, function (team) {
      _.forEach(team.players, function(player) {
        // players stored as Players ids
        if (!_.contains(self.players, player))
          self.players.push(player);
      });
    });
  }
  next();
});


leagueSchema.statics.getCurrentSeason = function(callback) {
  logger.log('league- getting current season');
  this.findOne({}, function(err, league) {
    if (err) logger.warn(err);
    for (var i=0;i<league.seasons.length;i++)
      if (league.seasons[i].active)
        return callback(null, league.seasons[i]);
    callback('no seasons found');
  });
}

leagueSchema.statics.getTeamByName = function(name, callback) {
  this.findOne({}, function(err, league) {
    if (err) logger.warn(err);
    for (var i=0;i<league.teams.length;i++)
      if (league.teams[i].name.toLowerCase()==name.toLowerCase())
        return callback(null, league.teams[i]);
    callback('No Team by that name: '+name);
  });
}


var League = mongoose.model('leagues', leagueSchema,'leagues');
module.exports = League;

// getTeamByName: function(name, callback) {
//     var season = this.getCurrentSeason();
//     for (var i=0;i<season.teams.length;i++)
//       if (season.teams[i].name==name)
//         return callback(null,season.teams[i]);
//     return callback('No Team by that name: '+name);
    
//   },
//   getCurrentSeason: function() {
//     return this.seasons[0];
//     // return this.seasons.getCurrent();
//   },
//   getSeasons: function() {
//     return this.seasons;
//   },
//   fresh: function(data, callback) {
//     if (!data.label) data.label = "Fresh_Season"
//     this.seasons.splice(0,0,new Season({label:data.label},function(err) {
//       if (err) return callback(err);
//       return callback(null);
//     }));
//   },