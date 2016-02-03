var fs = require('fs');
var _ = require('underscore');
var Spreadsheet = require('edit-google-spreadsheet');
var config = require('./config.js');
var aws = require('aws-sdk');
aws.config.update({accessKeyId: config.AWS_ACCESS_KEY, secretAccessKey: config.AWS_SECRET_KEY});
var s3 = new aws.S3();

var localSeasonsPath = './lib/seasons.json';
var currentSeason;

// boots up the league by 
function League() {
  console.log('League Created');
  this.seasons = [];
  // this.seasons = data.seasons || {};
  // // load all seasons from a json file
  // this.currentSeason = currentSeason || {};
  // this.allPlayers = data.allPlayers || [];
  // // load all players from a json file
  // this.currentPlayers = data.currentPlayers || [];
  // this.locations = data.locations || [];
  // Boot up
  this.load();
};

League.prototype = {

  load: function(onLoad) {
    var self = this;
    console.log('Loading League data');
    // Resets
    self.seasons = [];
    // Load seasons.json
    var s3_params = {
      Bucket: config.S3_BUCKET,
      Key: config.AWS_SECRET_KEY,
    };
    if (!config.localLoad)
      s3.getObject(s3_params, function(err, data) {
        if (err) return console.log(err);
        data = JSON.parse(data.Body.toString());
        _.forEach(data.seasons, function (season) {
          self.seasons.push(new Season(season));      
        });
        currentSeason = self.seasons[0];
      });
    else
      fs.readFile(localSeasonsPath, function read(err, data) {
        if (err) {throw err;}
        data = JSON.parse(data);
        _.forEach(data.seasons, function (season) {
          self.seasons.push(new Season(season));      
        });
        currentSeason = self.seasons[0];
      });
  },
  save: function() {
    console.log('Saving League Data');
    var seasonData = {seasons:[]};
    for (i=0;i<this.seasons.length;i++)
      seasonData.seasons.push(this.seasons[i]);
    var s3_params = {
        Bucket: config.S3_BUCKET,
        Key: config.AWS_SECRET_KEY,
        ACL: 'public-read-write',
        Body: JSON.stringify(seasonData),
        ContentType: 'application/json'
    };
    if (!config.localSave)
      s3.putObject(s3_params, function(err, data) {
        if (err) return console.log(err);
        console.log('League Data Saved: aws');
      });
    else
      fs.writeFile(localSeasonsPath,JSON.stringify(this.seasons, null, 4), function (err) {
        if (err) return console.log(err);
        console.log('League Data Saved: local');
      });
  },
  getCurrentSeason: function() {
    return this.seasons[0];
    // return this.currentSeason;
    // return this.seasons.getCurrent();
  },
  getSeasons: function() {
    return this.seasons;
  }

  // toString: function() {
  //   var returned = [];
  //   returned.push("{ Name: "+this.name);

  //   return returned.toString();
  // }
};
module.exports.League = League;

/*
  Location of each bar a match can be played at
*/
var homeLocation = 'The Copper Bucket';
function Location(data) {
  this.address = data.address || '';
  this.name = data.name || '';
};

Location.prototype = {
  getAddress : function() {
    return this.address;
  },
  getName : function() {
    return this.name;
  },
  isHome : function() {
    if (this.name===homeLocation)
      return true;
    else
      return false;
  }
};

module.exports.Location = Location;

/*
  Game
    individual games recorded in an individual Match
*/
function Game(data) {
  this.playerOne = data.playerOne || 'Your Mom'; // winner of the lag
  this.playerTwo = data.playerTwo || 'Your real Mom';
  this.innings = data.innings || 0;
  this.winner = data.winner || 'Tie';
  this.playerOneTimeouts = data.playerOneTimeouts || 0;
  this.playerTwoTimeouts = data.playerTwoTimeouts || 0;
  this.isEarlyScratchEight = data.isEarlyScratchEight || false;
  this.isBreakAndRun = data.isBreakAndRun || false;
  this.isEightBallBreak = data.isEightBallBreak || false;
};

Game.prototype = {

};

/*
  Match
    individual matches
*/
function Match(data) {
  this.matchNumber = data.matchNumber || 0;
  this.players = data.players || [
    {
      name: "Player One",
      team: "Team One",
      idNumber: 1,
      defense: 0,
      pointsEarned: 0,
      pointsGiven: 0,
      SL: 3,
      wins: 0,
      losses: 0  
    },
    {
      name: "Player Two",
      team: "Team Two",
      idNumber: 2,
      defense: 0,
      pointsEarned: 0,
      pointsGiven: 0,
      SL: 3,
      wins: 0,
      losses: 0  
    }
  ];
  if (this.players.length===1) {
    this.players.push(
      {
        name: "Player Two",
        team: "Team Two",
        idNumber: 2,
        defense: 0,
        pointsEarned: 0,
        pointsGiven: 0,
        SL: 3,
        wins: 0,
        losses: 0  
      }
    );
  }
  // this.winner = data.winner || (function determineWinner() { 
  //   if (this.players[0].pointsEarned>this.players[0].pointsGiven)
  //     return this.players[0].name;
  //   else
  //     return this.players[1].name;
  // })();
  this.race = data.race || '2:2';
  this.games = data.games || [];
  // console.log('Match: '+this.players[0].name+' vs '+this.players[1].name);
};

Match.prototype = {

};

/*
  MatchUp
    collections of 5 matches for a League night
*/
function MatchUp(data) {
  this.date = data.date || 'Never';
  this.location = data.location || 'Nowhere';
  this.teams = data.teams || 'Empty MatchUp Teams';
  this.matches = [];
  if (data.matches)
    for (i=0;i<data.matches.length;i++)
      this.matches.push(new Match(data.matches[i]));
  console.log('MatchUp ('+this.date+') Loaded');
};

MatchUp.prototype = {

};

/*
  Team
*/
function Team(data) {
  this.players = data.players || [];
  this.name = data.name || 'Blank Team';
  this.idNumber = data.idNumber || 0;
}

Team.prototype = {

};



/**
* 12/23/15
* @author Schizo
*
* Player Class from It Is What It Is Sheet Scripts modified for easy Player manipulation
*  records name, matches (earned, given, match#), won, lost, skunks, skunked, sl
*
* @constructor
* @param stats {data} the data of the player in the format of {"name":name,"sl":sl,etc}
*/
function Player(data) {
  // console.log("New Player: "+data.name+' - '+data.sl);
  this.name = data.name || 'Schizo';
  this.matches = data.matches || []; // [[pointsEarned,pointsGiven,when]]
  this.pointsEarned = data.pointsEarned || 0;
  this.pointsGiven = data.pointsGiven || 0;
  this.matchesWon = data.matchesWon || 0;
  this.matchesLost = data.matchesLost || 0;
  this.mvp = (this.pointsEarned/(this.matchesWon+this.matchesLost));
  this.skunks = data.skunks || 0;
  this.skunked = data.skunked || 0;
  this.sl = data.sl || 3;
  this.team = data.team || 'Free Agent';
};

Player.prototype = {
  // MATCH
  addMatchStats: function(pointsEarned, pointsGiven, matchDate, matchNum) {
    this.matches.push([pointsEarned, pointsGiven, matchDate, matchNum]);
    this.pointsEarned+=pointsEarned;
    this.pointsGiven+=pointsGiven;
    if (pointsEarned>pointsGiven)
      this.matchesWon++;
    else
      this.matchesLost++;
    this.skunkCheck(pointsEarned,pointsGiven);
    this.mvp = (this.pointsEarned/(this.matchesWon+this.matchesLost));
  },
  // SKUNKS
  skunkCheck: function(earned, given) {
    if (earned==3&&given==0)
      this.skunks++;
    if (given==3&&earned==0)
      this.skunked++;
    // if (this.name=="Danny")
      // this.addSkunk();
  },
  toStats: function() {return (this.name+': Matches Won: '+this.matchesWon+', Matches Lost: '+this.matchesLost+', Points Earned: '+this.pointsEarned+', Points Given: '+this.pointsGiven+', Skunks: '+this.skunks+', Skunked: '+this.skunked+', PPM: '+(Math.round(this.mvp*100)/100));},
  toString: function() {
    var returned = [];
    returned.push("{ Name: "+this.name);
    returned.push(" Points Earned: "+this.pointsEarned);
    returned.push(" Points Given: "+this.pointsGiven);
    returned.push(" Matches Won: "+this.matchesWon);
    returned.push(" Matches Lost: "+this.matchesLost);
    returned.push(" Skunks: "+this.skunks);
    returned.push(" Skunked: "+this.skunked+" }");
    return returned.toString();
  }
};

module.exports.Player = Player;

var seasons = []; // an array of all the recorded Seasons
var Season = function(data) {
  var self = this;
  console.log('Loading Season');
  self.label = data.label || 'Blank';
  self.players = [];
  if (data.players)
    for (i=0;i<data.players.length;i++)
      self.players.push(new Player(data.players[i]));
  self.schedule = data.schedule;
  // Build from empty Player list or Schedule
  if (!self.players||!self.schedule)
    Spreadsheet.load({
      debug: false,
      spreadsheetId: config.ItIsWhatItIs_Spreadsheet_ID,
      worksheetId: config.ItIsWhatItIs_referencesSheetID,
      worksheetName: 'references',
      oauth : {
        email: config.Frybot_Google_ServiceEmail,
        key: config.Frybot_Google_key
      }
    },
    function sheetReady(err, spreadsheet) {
      if(err) throw err;
      spreadsheet.receive(function(err, rows, info) {
        if(err) throw err;
        console.log('Loading Players & Schedule');
        rows = _.toArray(rows);
        rows.shift();
        var playersAndSLs = [], 
            weeks = [];
        _.forEach(rows, function(cols) {
          if (cols[1])
            playersAndSLs.push(new Player({name: cols[1],SL: cols[2]}));
          if (cols[3])
            weeks.push(
              {
                date: cols[4],
                opponent: cols[5],
                location: cols[7]
              }
            );
        });
        self.players = playersAndSLs;
        self.schedule = weeks;
      });
    });
// console.log('matchups: '+JSON.stringify(data.matchups));
var matchups = [];
  if (data.matchups)
  _.forEach(data.matchups, function (matchup) {
    matchups.push(new MatchUp(matchup));
  });
  self.matchups = matchups;

    // for (i=0;i<data.matchups.length;i++)
    //   this.matchups.push(new MatchUp(data.matchups[i]));
  console.log('Season - '+self.label+' - Loaded');
}
Season.prototype = {
  getLabel: function() {
    return this.label;
  },
  // the most previous matchup
  getLastMatchup: function() {

  },
  getLocations: function() {
    return this.locations;
  },
  getMatches: function() {
    return this.matches;
  },
  // the next scheduled matchup
  getNextMatchup: function() {

  },
  getOpponents: function() {
    return this.opponents;
  },
  getPlayers: function() {
    return this.players;
  },
  getWeeksMatchup: function() {
    var date = new Date().getDate();
    for (i=0;i<this.matchups.length;i++) {
      var matchDate = this.matchups[i].dateOf;
      console.log('date: '+date);
      matchDate = new Date(matchDate);
      console.log('getWeeksMatchup: '+matchDate);
      matchDate = matchDate.getDate();
      console.log('getWeeksMatchup: '+matchDate);
      if (date===matchDate)
        return this.matchups[i];
    }
  },
  getYear: function() {
    return this.year;
  }
  

};





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