var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    Schedule = require('../models/schedule'),
    Team = require('../models/team'),
    Matchup = require('../models/matchup'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Match Schema
var seasonSchema = new Schema({
  label: { type: String },
  teams: { type: Array, default: [] },
  date: {
    start: { type: Date, default: moment() },
    end: { type: Date },
  },
  schedule: { type: Schema.Types.ObjectId, ref: 'schedule', default: new Schedule() },
  matchups: { type: Array, default: [] },
},options);

seasonSchema.pre('save', function(next) {
  logger.debug('season saved: %s',this.label);
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
    if (this.date.end.month()==0||this.date.end.month()>=8)
      this.date.end.weeks(this.date.end.weeks()+16);
    else if (this.date.end>=4)
      this.date.end.weeks(this.date.end.weeks()+11);
  }

  if (this.isModified('matchups')) 
    for (var i=1;i<=this.schedule.length;i++) {
      var matchup = new Matchup({'matchNum':i});
      this.matchups.push(matchup);
      logger.log('MatchUp ('+matchup.matchNum+'/'+this.schedule.length+') Loaded');
    }

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
seasonSchema.methods.getTodaysMatchup = function() {
  var today = new Date();
  for (i=0;i<this.matchups.length;i++) {
    var matchDate = new Date(this.matchups[i].date);
    if (today.getDate()===matchDate.getDate()&&today.getMonth()===matchDate.getMonth())
      return this.matchups[i];
  }
  return this.matchups[0];
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
seasonSchema.methods.updateMatchups = function(matchups) {
  // matchups is an array of arrays of 1-5 matches
  for (i=0;i<this.matchups.length&&i<matchups.length;i++) 
    for (j=0;j<matchups.length;j++) {
      // console.log(this.matchups[i].date+' vs '+matchups[j][0].matchDate);
      if (this.matchups[i].date===matchups[j][0].matchDate) {
        // console.log('match found: '+this.matchups[i].date+' vs '+matchups[j][0].matchDate);
        this.matchups[i].updateMatches(matchups[j]);
        break;
      }
    }
  // update players from new matchup data
  var players = [];
  _.forEach(this.teams, function (team) {
    _.forEach(team.players, function (player) {
      players.push(player);
    });
  });
  for (p=0;p<players.length;p++)
    for (i=0;i<matchups.length;i++)
      for (j=0;j<matchups[i].length;j++)
        if (matchups[i][j].name===players[p].name) 
          players[p].addMatch(matchups[i][j]);
}

var Season = mongoose.model('seasons', seasonSchema,'seasons');
module.exports = Season;