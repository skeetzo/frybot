var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    Game = require('../models/game'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Match Schema
var matchSchema = new Schema({
  // Players
  playerOne: { type: Schema.Types.ObjectId, ref: 'player', required: true },
  playerTwo: { type: Schema.Types.ObjectId, ref: 'player', required: true },
  // Points
  playerOnePointsEarned: { type: Number, default: 0 },
  playerOnePointsGiven: { type: Number, default: 0 },
  playerTwoPointsEarned: { type: Number, default: 0 },
  playerTwoPointsGiven: { type: Number, default: 0 },

  games: { type: Array, default: [] },
  // Info
  matchDate: { type: Date, default: moment().format('DD/MM/YYYY') },
  matchNum: { type: Number, default: 0 },
  race: { type: String, default: '2:2' },
  totalInnings: { type: Number, default: 0 },
  winner: { type: Schema.Types.ObjectId, ref: 'player' },
  loser: { type: Schema.Types.ObjectId, ref: 'player' },
},options);

matchSchema.pre('save', function(next) {
  logger.debug('match saved: %s vs %s',this.playerOne.name,this.playerTwo.name);

  if ( this.isModified('playerOne')
    || this.isModified('playerTwo')
    || this.isModified('playerOnePointsEarned')
    || this.isModified('playerOnePointsGiven')
    || this.isModified('playerTwoPointsEarned')
    || this.isModified('playerTwoPointsEarned')
    || this.isModified('playerTwoPointsEarned')
    || this.isModified('playerTwoPointsGiven')
    )
    this.determineWinner();

  next();
});

// Statics
// Methods
/*
  Compares score to determine winner
*/
matchSchema.methods.determineWinner = function() {
  if (this.playerOne.pointsEarned>this.playerTwo.pointsEarned) {
    this.winner = this.playerOne;
    this.loser = this.playerTwo;
  }
  else {
    this.winner = this.playerTwo;
    this.loser = this.playerOne;
  }
};









// this probably needs to be changed

/*
  Updates the corresponding player's score for the match
*/
matchSchema.methods.update = function(data) {
  // console.log('updating Match num: '+this.matchNumber);
  if (data.name==='Bye') {
    this.playerOne.name = data.name;
    this.playerTwo.name = data.name;
  }
  if (this.playerOne.name==='Player One')
    this.playerOne.name = data.name;
  var players = [this.playerOne,this.playerTwo];
  _.forEach(players, function(player) {
    if (player.name===data.name) {
      // console.log('updating match player: '+player.name);
      // player.defenses = data.defenses;
      player.pointsEarned = data.pointsEarned;
      player.pointsGiven = data.pointsGiven;
    }
  });
  this.determineWinner();
}














var Match = mongoose.model('matches', matchSchema,'matches');
module.exports = Match;