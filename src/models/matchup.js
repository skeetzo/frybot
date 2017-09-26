var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    Location = require('../models/location'),
    Team = require('../models/team'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Match Schema
var matchUpSchema = new Schema({
  date: { type: Date, default: moment().format('MM/DD/YYYY') },
  location: { type: Schema.Types.ObjectId, ref: 'location', default: new Location() },
  teamOne: { type: Schema.Types.ObjectId, ref: 'team', default: new Team() },
  teamTwo: { type: Schema.Types.ObjectId, ref: 'team', default: new Team() },
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

var Matchup = mongoose.model('matchups', matchUpSchema,'matchups');
module.exports = Matchup;