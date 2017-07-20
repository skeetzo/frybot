var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index'),
    logger = config.logger,
    Location = require('../models/location'),
    Team = require('../models/team'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Schedule Schema
var scheduleSchema = new Schema({
  date: { type: String, default: ('_____ Season '+moment('DD/MM/YYYY')) },
  length: { type: Number, default: 10 },
  // teams: { type: Array, default: [(),(new Team())] },
  location: { type: Schema.Types.ObjectId, ref: 'location', default: new Location() },
  matchNum: { type: Number, default: 0 },

  teamOne: { type: Schema.Types.ObjectId, ref: 'team', default: new Team() },
  teamTwo: { type: Schema.Types.ObjectId, ref: 'team', default: new Team() },

},options);

scheduleSchema.pre('save', function(next) {
  logger.debug('season saved: %s vs %s',this.teamOne.name,this.teamTwo.name);
  next();
});

/*
  Returns players names
*/
scheduleSchema.methods.getPlayersByNames = function() {
  var playersTemp = [];
  _.forEach(this.teamOne, function (team) {
  	_.forEach(team.players, function (player) {
		playersTemp.push(player.name);
  	});
  });
  _.forEach(this.teamTwo, function (team) {
  	_.forEach(team.players, function (player) {
		playersTemp.push(player.name);
  	});
  });
  return playersTemp;
};

var Schedule = mongoose.model('schedule', scheduleSchema,'schedule');
module.exports = Schedule;