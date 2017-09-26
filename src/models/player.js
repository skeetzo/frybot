var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    Match = require('../models/match'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// User Schema
var playerSchema = new Schema({
  name: { type: String, required: true },
  matches: { type: Array, default: [] },
  pointsEarned: { type: Number, default: 0 },
  pointsGiven: { type: Number, default: 0 },
  matchesWon: { type: Number, default: 0 },
  matchesLost: { type: Number, default: 0 },
  skunks: { type: Number, default: 0 },
  skunked: { type: Number, default: 0 },
  sl: { type: Number, default: 3 },
  mvp: { type: Number, default: 0 },

  team: { type: Schema.Types.ObjectId, ref: 'team' },
},options);

playerSchema.pre('save', function(next) {
  logger.debug('player saved: %s',this.name);
  next();
});

// Statics
// Methods
playerSchema.methods.addMatch = function(data, callback) {
  var pointsEarned = data.pointsEarned,
      pointsGiven = data.pointsGiven,
      matchDate = data.matchDate,
      matchNum = data.matchNum,
      player = this.name,
      opponent = data.opponent;
  this.matches.push(new Match({
    'pointsEarned': pointsEarned, 
    'pointsGiven': pointsGiven, 
    'matchDate': matchDate, 
    'matchNum': matchNum,
    'player': player,
    'opponent': opponent
  }));
  this.pointsEarned+=pointsEarned;
  this.pointsGiven+=pointsGiven;
  if (pointsEarned>pointsGiven)
    this.matchesWon++;
  else
    this.matchesLost++;
  this.skunkCheck(pointsEarned,pointsGiven);
  this.mvp = this.pointsEarned/(this.matchesWon+this.matchesLost);
  this.save(function (err) {
    if (err) logger.warn(err);
    if (callback) callback(null);
  });
};

playerSchema.methods.resetStats = function() {
  logger.debug('resetting player: '+this.name);
  this.matches = []; // [[pointsEarned,pointsGiven,when]]
  this.pointsEarned = 0;
  this.pointsGiven = 0;
  this.matchesWon = 0;
  this.matchesLost = 0;
  this.skunks = 0;
  this.skunked = 0;
  this.mvp = (this.pointsEarned/(this.matchesWon+this.matchesLost));
  this.skunkCheck();
  this.save(function (err) {
    if (err) logger.warn(err);
  })
};

playerSchema.methods.skunkCheck = function(earned, given) {
  if (earned==3&&given==0)
    this.skunks++;
  if (given==3&&earned==0)
    this.skunked++;
  // if (this.name=="Danny"||this.name=="Nico")
    // this.skunked++;
};

playerSchema.methods.toString = function() {
  var returned = [];
  returned.push(this.name);
  returned.push(this.pointsEarned);
  returned.push(this.pointsGiven);
  returned.push(this.matchesWon);
  returned.push(this.matchesLost);
  returned.push(this.skunks);
  returned.push(this.skunked);
  return returned.toString();
};

playerSchema.methods.toStats = function() {
  var returned = [];
  returned.push(this.name);
  returned.push(this.pointsEarned);
  returned.push(this.pointsGiven);
  returned.push(this.matchesWon);
  returned.push(this.matchesLost);
  returned.push(this.skunks);
  returned.push(this.skunked);
  return returned;
}

var Player = mongoose.model('players', playerSchema,'players');
module.exports = Player;