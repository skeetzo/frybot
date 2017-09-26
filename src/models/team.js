var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    Sheets = require('../mods/sheets.js'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Match Schema
var teamSchema = new Schema({
  name: { type: String, default: '' },
  players: { type: Array, default: [] },
  idNumber: { type: Number, default: 0 },
  home: { type: Boolean, default: false },
},options);

teamSchema.pre('save', function(next) {
  logger.debug('team saved: %s',this.name);
  next();
});

teamSchema.statics.addHome = function(name, callback) {
  logger.debug('Adding Home Team: %s',name);
  var team = new Team({'name':name,'home':true});
  team.resetPlayersFromSheet(function(err) {
    if (err) return callback(err);
    self.save(function(err) {
      if (err) return callback(err);
    });
  });
}

teamSchema.methods.resetPlayersFromSheet = function(callback) {
  var self = this;
  Sheets.getCurrentPlayers(function (err, players) {
    if (err) return callback(err);
    _.forEach(players, function (player) {
      player.team = self.team;
      Player.findOneAndUpdate({'name':player.name}, player, {'upsert':true},function(err) {
        if (err) logger.warn(err);
      });
      self.team.players.push(player);
    });
    self.save(function (err) {
      if (err) return callback(err);
      logger.debug('team updated: %s',self.name);
      callback(null);
    });
  });
}

var Team = mongoose.model('teams', teamSchema,'teams');
module.exports = Team;