var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Match Schema
var leagueSchema = new Schema({
  name: { type: String, default: '' },
  division: { type: String, default: '' },
  seasons: { type: Array, default: [] },
  players: { type: Array },
  teams: { type: Array },
  locations: { type: Array, default: [] },

},options);

leagueSchema.pre('save', function(next) {
  var self = this;
  logger.debug('league saved: %s',this.name);

  if (!this.seasons) {
    logger.debug('league- no seasons found')
    return next();
  }
  if (!this.teams) {
    logger.debug('league- updating teams');
    this.teams = _.pluck(this.seasons,'teams');
  }
  if (!this.players) {
    logger.debug('league- updating players');
    _.forEach(self.teams, function (team) {
      _.forEach(team.players, function(player) {
        // players stored as Players ids
        if (!_.contains(self.players, player)
          self.players.push(player);
      });
    });
  }
  next();
});

leagueSchema.methods.getCurrentSeason = function(callback) {
  logger.log('league- getting current season');
  for (var i=0;i<this.seasons.length;i++)
    if (this.seasons[i].active)
      return this.seasons[i];
  logger.warn('no seasons found');
  return null;
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