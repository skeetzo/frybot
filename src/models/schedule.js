var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index'),
    logger = config.logger,
    Sheets = require('../mods/sheets'),
    Location = require('../models/location'),
    Matchup = require('../models/matchup'),
    Team = require('../models/team'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Schedule Schema
var scheduleSchema = new Schema({
  label: { type: String },
  date: {
    start: { type: Date, default: moment().format('MM/DD/YYYY') },
    end: { type: Date },
  },
  matchups: { type: Array, default: [] },
  locations: { type: Array, default: [] },
  teams: { type: Array, default: [] },
},options);

scheduleSchema.pre('save', function(next) {
  if (!this.label) {
    if (this.date.start.month()<3)
      this.label = 'Spring Season '+this.date.start.year();
    else if (this.date.start.month()<6)
      this.label = 'Summer Season '+this.date.start.year();
    else
      this.label = 'Winter Season '+this.date.start.year();
  }
  logger.debug('schedule saved: %s',this.label);
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

scheduleSchema.statics.getTodaysLocation = function(callback) {
  this.findOne({},function(err, schedule) {
    if (err) logger.warn(err);
    var date = moment(new Date()).format('MM/DD/YYYY');
    // logger.log('date: %s',date);
    if (schedule.matchups.length==0) return logger.log('Missing Matchups');
    for (var i=0;i<schedule.matchups.length;i++) {
      // logger.log('matchup: %s',JSON.stringify(schedule.matchups[i],null,4));
      if (moment(new Date(schedule.matchups[i].date)).format('MM/DD/YYYY')==date)
        return callback(null,schedule.matchups[i].location);
    }
    return callback('Missing Matchup');
  })
}

scheduleSchema.methods.loadCurrentSchedule = function(callback) {
  var self = this;
  logger.debug('loading current schedule');
  Sheets.loadSchedule(function (err, weeks) {
    if (err) {
      logger.warn(err);
      return callback(err);
    }
    self.matchups = [];
    self.teams = [];
    self.locations = [];
    _.forEach(weeks, function (week) {
      self.matchups.push(new Matchup(week));
      if (!_.contains(self.teams,week.teamTwo))
        self.teams.push(week.teamTwo);
      if (!_.contains(self.locations,week.location))
        self.locations.push(week.location);
    });
    self.save(function (err) {
      if (err) logger.warn(err);
      logger.debug('current schedule updated');
      callback(null);
    });
  });
}

var Schedule = mongoose.model('schedule', scheduleSchema,'schedule');
module.exports = Schedule;