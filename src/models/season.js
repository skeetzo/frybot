var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    Schedule = require('../models/schedule'),
    Team = require('../models/team'),
    Player = require('../models/player'),
    Matchup = require('../models/matchup'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Match Schema
var seasonSchema = new Schema({
  label: { type: String },
  teams: { type: Array, default: [] },
  date: {
    start: { type: Date, default: moment().format('MM/DD/YYYY') },
    end: { type: Date },
  },
  schedule: { type: Schema.Types.ObjectId, ref: 'schedule' },
  matchups: { type: Array, default: [] },
  active: { type: Boolean, default: false },
},options);

seasonSchema.pre('save', function(next) {
  var date = moment(this.date.start),
      month = date.month(),
      year = date.year();
  if (!this.label) {
    if (month<3)
      this.label = 'Spring Season '+year;
    else if (month<6)
      this.label = 'Summer Season '+year;
    else
      this.label = 'Winter Season '+year;
  }

  if (!this.date.end) {
    this.date.end = moment(this.date.start);
    if (this.date.end.month==0||this.date.end.month>=8)
      this.date.end.weeks = this.date.end.weeks+16;
    else if (this.date.end>=4)
      this.date.end.weeks = this.date.end.weeks+11;
  }

  if (this.isModified('matchups')) 
    for (var i=1;i<=this.schedule.length;i++) {
      var matchup = new Matchup({'matchNum':i});
      this.matchups.push(matchup);
      logger.log('MatchUp ('+matchup.matchNum+'/'+this.schedule.length+') Loaded');
    }
  logger.debug('season saved: %s',this.label);
  next();
});

// seasonSchema.pre('init', function(next) {
//   logger.debug('season created: %s',this.label);

  // var self = this;
  // async.series([
  //   function(callback) {
  //     if (!this.schedule) 
  //       Sheets.loadSchedule(function (err, matchups) {
  //         if (err) logger.warn(err);
  //         var matchups_ = [];
  //         _.forEach(matchups, function (matchup) {
  //           matchups_.push(new Matchup({
  //             'teamOne': matchup.teamOne,
  //             'teamTwo': matchup.teamTwo,
  //             'location': matchup.location,
  //             'date': matchup.date,
  //           }));
  //         });
  //         self.matchups = matchups_;
  //       });
  //     else
  //       callback(null);

  //   },
  //   function(callback) {
  //     if (!this.matchups) 
  //       for (var i=1;i<=this.schedule.length;i++) {
  //         var matchup = new Matchup({'matchNum':i});
  //         this.matchups.push(matchup);
  //         logger.log('MatchUp ('+matchup.matchNum+'/'+this.schedule.length+') Prepped');
  //       }
  //     else
  //       callback(null);
  //   },
  //   function(callback) {
  //     next();
  //   },
  // ]); 
// });

seasonSchema.statics.getCurrentSeason = function(callback) {
  this.findOne({'active':true}, function(err, season) {
    if (err) logger.warn(err);
    if (season) return callback(null, season);
    callback('no active season found');
  });
}

seasonSchema.methods.addTeam = function(team, callback) {
  if (!_.contains(_.pluck(this.teams,'name'),team.name)) {
    logger.log('team %s added to %s',team.name,this.label);
    this.teams.push(team);
  }
  else
    logger.log('team %s already exists in %s',team.name,this.label);
  this.save(function(err) {
    if (err) return callback(err);
    callback(null);
  })
}

/*
  Returns players names
*/
seasonSchema.methods.getPlayersByNames = function() {
  var playersTemp = [];
  _.forEach(this.teams, function (team) {
    var players = _.pluck(team.players,'name');
    _.forEach(players, function (player) {
      playersTemp.push(player);
    });
  });
  return playersTemp;
};

/*
  Returns the matchup for this week
*/
seasonSchema.statics.getTodaysMatchup = function(callback) {
  var today = moment(new Date()).format('MM/DD/YYYY');
  today.date = today.date++;
  Matchup.findOne({'date.start':today},function(err, matchup) {
    if (err) return callback(err);
    if (!matchup) return callback('Missing Matchup');
    return callback(null, matchup);
  });
};

/*
  uhhh resets players?
*/
seasonSchema.methods.resetPlayers = function() {
  _.forEach(this.teams, function (team) {
    _.forEach(team.players, function (player) {
      player.resetStats();
    });
  });
};

/*
  Updates match data from a provided array of matches
*/
seasonSchema.methods.updateMatchups = function(newMatchups) {
  var self = this;
// logger.log('doing stuff');
// return;
  // logger.log('new matchups: %s',JSON.stringify(newMatchups,null,4));
  for (var i=0;i<newMatchups.length;i++) {
    Matchup.findOneAndUpdateMatches(newMatchups[i],function (err, matchup) {
      if (err) logger.warn(err);
      logger.log('matchup updated: %s',matchup.date);
    });
    for (var j=0;j<newMatchups[i].length;j++)
      Player.findOneAndAddMatch(newMatchups[i][j], function (err, player) {
        if (err) logger.warn(err);
        logger.log('player updated: %s',player.name);
      });
  }
}

var Season = mongoose.model('seasons', seasonSchema,'seasons');
module.exports = Season;