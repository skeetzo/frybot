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
  date: { type: Date, default: moment('DD/MM/YYYY') },
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

var Matchup = mongoose.model('matchups', matchUpSchema,'matchups');
module.exports = Matchup;