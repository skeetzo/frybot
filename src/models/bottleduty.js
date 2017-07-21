var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    Player = require('../models/player'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Bottle Duty Schema
var bottleDutySchema = new Schema({
  index: { type: Number, default: 0 },
  players: { type: Array, default: [] },
  bottles: { type: Array, default: ['malibu bitchass rum','women\'s vodka','jaeger and redbull','jaeger and redbull','jaeger and redbull','jack and coke','jack and coke','jack and coke, bitch'] },

},options);

// Statics
// Methods
bottleDutySchema.methods.addPlayers = function(players, callback) {
  _.forEach(players, function (player) {
    this.players.push(new Player(player));
  });
  this.save(function (err) {
    if (err) logger.warn(err);
    if (callback) callback(null);
  })
}

bottleDutySchema.methods.getDuty = function() {
  var player = this.players[this.index];
  if (!player) {
    logger.warn('Empty Players in Bottle Duty');
    return null;
  }
  this.index++;
  this.save(function (err) {
    if (err) logger.warn(err);
    return player;
  })
}

bottleDutySchema.methods.getRandomDuty = function() {
  var player = this.players[Math.floor(Math.random()*this.players.length)];
  if (!player) {
    logger.warn('Empty Players in Bottle Duty');
    return null;
  }
  return player;
}



bottleDutySchema.methods.getBottle = function() {
  var bottle = this.bottles[Math.floor(Math.random()*this.bottles.length)];
  if (!bottle) {
    logger.warn('Empty Bottles in Bottle Duty');
    return null;
  }
  return bottle;
}



var BottleDuty = mongoose.model('bottleduty', bottleDutySchema,'bottleduty');
module.exports = BottleDuty;