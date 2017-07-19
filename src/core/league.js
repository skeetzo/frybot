var _ = require('underscore'),
    fs = require('fs'),
    config = require('../config/index'),
    logger = config.logger,
    Season = require('../models/season'),
    Player = require('../models/player'),
    Spreadsheet = require('edit-google-spreadsheet');

/*
  League Constructor
*/
function League(seasons, callback) {
  console.log('League Created');
  var self = this;
  self.seasons = [];
  // Data initialization
  var count = 0; // counts loaded seasons for completion
  _.forEach(seasons, function (season) {
    var newSeason = new Season(season, function(err) {
      if (err) return logger.warn(err);
      count++;
      if (count===seasons.length)
        callback(null);
    });
    self.seasons.push(newSeason);
  });
}

League.prototype = {
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