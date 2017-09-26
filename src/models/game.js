var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// User Schema
var gameSchema = new Schema({
  playerOne: { type: String, default: '' },
  playerTwo: { type: String, default: '' },
  innings: { type: Number, default: 0 },
  winner: { type: String, default: '' },
  loser: { type: String, default: '' },
  playerOneTimeouts: { type: Number, default: 0 },
  playerTwoTimeouts: { type: Number, default: 0 },
  isEarlyScratchEight: { type: Boolean, default: 0 },
  isBreakAndRun: { type: Boolean, default: 0 },
  isEightBallBreak: { type: Boolean, default: 3 },
  mvp: { type: Number, default: 0 },

},options);

gameSchema.pre('save', function(next) {
  logger.debug('game saved: %s vs %s',this.playerOne.name,this.playerTwo.name);
  next();
});

// Statics
// Methods

var Game = mongoose.model('games', gameSchema,'games');
module.exports = Game;