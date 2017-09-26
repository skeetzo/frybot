var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    Sheets = require('../mods/sheets.js'),
    Player = require('../models/player.js'),
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
  var self = this;
  _.forEach(self.players, function(player) {
    player.team = self.name;
    Player.findOneAndUpdate({'name':player.name},player,{'upsert':true},function(err) {
      if (err) logger.warn(err);
    });
  });
  logger.debug('team saved: %s',this.name);
  next();
});

teamSchema.statics.addHome = function(name, callback) {
  logger.debug('Adding Home Team: %s',name);
  this.findOneAndUpdate({'name':name},{'home':true},{'upsert':true,'new':true},function(err, team) {
    if (err) logger.warn(err);
    team.resetPlayersFromSheet(function(err) {
      if (err) return callback(err);
      team.save(function(err) {
        if (err) return callback(err);
        callback(null, team);
      });
    });
  });
}

teamSchema.methods.resetPlayersFromSheet = function(callback) {
  var self = this;
  Sheets.getCurrentPlayers(function (err, players) {
    if (err) return callback(err);
    _.forEach(players, function (player) {
      player.team = self.name;
      Player.findOneAndUpdate({'name':player.name}, player, {'upsert':true},function(err) {
        if (err) logger.warn(err);
      });
      self.players.push(player);
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