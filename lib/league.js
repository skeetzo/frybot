var fs = require('fs');
var _ = require('underscore');

// boots up the league by 
function League(data, onLoad) {

  console.log('League Created');
  this.seasons = data.seasons || {};
  // load all seasons from a json file
  this.currentSeason = currentSeason || {};
  this.allPlayers = data.allPlayers || [];
  // load all players from a json file
  this.currentPlayers = data.currentPlayers || [];
  this.locations = data.locations || [];
  // Boot up
  this.load(onLoad);
};

League.prototype = {

  load: function(onLoad) {
    console.log('Loading League data');
    // Resets
    seasons = [];
    players = [];
    // opponents = [];
    locations = [];
    matchups = [];

    function loadSeasons(data) {
      _.forEach(data, function (season) {
        seasons.push(new Season(season));
        var label_ = season.label || 'missing season label';
        var matchups_ = [];
        if (data.matchups!=undefined)
          _.forEach(data.matchups, function (matchup) {
            // matchup as a whole
            matchups.push(matchup);
            locations.push(matchup.location);
            // players, opponents as single entities
//             _.forEach(matchup, function (match) {
// \             players.push(match.player);
//               opponents.push(match.opponent);
//             });
          });
        if (onLoad)
          onLoad();
        // the result is a bunch of data loaded sequentially
        // exit
      })
    }

    // First I want to read the file
    fs.readFile('./lib/seasons.json', function read(err, data) {
      if (err) {throw err;}
      data = JSON.parse(data);
      // console.log("seasons.json: "+JSON.stringify(data.seasons));
      loadSeasons(data.seasons);
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
};

Game.prototype = {

};

/*
  Match
    individual matches
*/
function Match(data) {
  this.matchNumber = data.matchNumber || 0;
  this.playerOneDefense = data.playerOneDefense || 0;
  this.playerTwoDefense = data.playerTwoDefense || 0;
  this.winner = data.winner || 'Tie';
  this.pointsEarned = data.pointsEarned || 0;
  this.pointsGiven = data.pointsGiven || 0;
  this.games = data.games || [];
};

Match.prototype = {

};

/*
  MatchUp
    collections of 5 matches for a League night
*/
function MatchUp(data) {
  this.dateOf = data.dateOf || 'Never';
  this.location = data.location || 'Nowhere';
  this.teams = data.teams || 'Empty MatchUp Teams';
  this.matches = data.matches || [];
};

MatchUp.prototype = {

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
  this.label = data.label || 'Blank';
  this.year = data.year || 'never';
  // this.players = data.players || [];
  // this.opponents = data.opponents || [];
  // this.matches = data.matches || [];
  this.matchups = data.matchups || [];
  // this.locations = data.locations || [];
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
    for (i=0;i<this.matchups.length;i++) {\
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
    label: "the name of the season"
    matchups: [
      {
        location: "the name of the bar",
        versus: "the name of the opposing team",
        matches: [
          match: {
            games: [ ],
              player: {
                earned: "the points earned",
                given: "the points given",
                defenses: "the points given",
                eightBreak: "the number of eight ball breaks",
                breakAndRun: "the number of break and runs"
              },
              opponent: {
                earned: "the points earned",
                given: "the points given",
                defenses: "the points given",
                eightBreak: "the number of eight ball breaks",
                breakAndRun: "the number of break and runs"
              },
            matchNum: "the match number"
          }
        ],
        date: "the date of the match",
        earned: "the total number of points earned by the team"
        given: "the total number of points given by the team"
      }
    ]
  }
*/  