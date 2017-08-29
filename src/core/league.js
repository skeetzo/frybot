var _ = require('underscore'),
    fs = require('fs'),
    config = require('../config/index'),
    logger = config.logger,
    Season = require('../models/season'),
    Player = require('../models/player');
/*
  League Constructor
*/
function League(seasons) {
  logger.log('League Created');
  var self = this;
  self.seasons = seasons;

  // self.seasons = [];
  // // Data initialization
  // var count = 0; // counts loaded seasons for completion
  // _.forEach(seasons, function (season) {
  //   var newSeason = new Season(season);
  //   self.seasons.push(newSeason);
  // });
}

League.prototype = {
  getTeamByName: function(name, callback) {
    var season = this.getCurrentSeason();
    for (var i=0;i<season.teams.length;i++)
      if (season.teams[i].name==name)
        return callback(null,season.teams[i]);
    return callback('No Team by that name: '+name);
    
  },
  getCurrentSeason: function() {
    return this.seasons[0];
    // return this.seasons.getCurrent();
  },
  getSeasons: function() {
    return this.seasons;
  },
  fresh: function(data, callback) {
    if (!data.label) data.label = "Fresh_Season"
    this.seasons.splice(0,0,new Season({label:data.label},function(err) {
      if (err) return callback(err);
      return callback(null);
    }));
  },

}

module.exports.League = League;






/*
  season: {
    label: "the name of the season",
  "players": [
    {
      "name": "",
      "SL": ""
    }
  ],
  "schedule": [
    {
      "date": "",
      "opponent": "",
      "location": ""
    }
  ],
    matchups: [
      {
        location: "the name of the bar",
        versus: "the name of the opposing team",
        matches: [
          match: {
            matchNumber,
            players: {
              name,
              team,
              idNumber,
              defense,
              pointsEarned,
              pointsGiven,
              SL,
              wins,
              losses
            },
            winner, 
            race, 
            games: [ 
              {
                playerOne, 
                playerTwo,
                innings, 
                winner,
                playerOneTimeouts, 
                playerTwoTimeouts, 
                isEarlyScratchEight, 
                isBreakAndRun,
                isEightBallBreak 
              }
            ]
          }
        ],
        date: "the date of the match",
        earned: "the total number of points earned by the team"
        given: "the total number of points given by the team"
      }
    ]
  }
*/  