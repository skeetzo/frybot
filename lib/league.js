var fs = require('fs');
var _ = require('underscore');

// boots up the league by 
function League(data, onLoad) {

  console.log('League Created');
  this.seasons = {};
  // load all seasons from a json file
  this.currentSeason = {};
  
  this.allPlayers = [];
  // load all players from a json file
  this.currentPlayers = [];

  this.locations = [];

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
        console.log('League data loaded');
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
function Player(stats) {
  if (stats.name==null||stats.name==undefined)
    stats.name = "Default";
  if (stats.matches==null||stats.matches==undefined)
    stats.matches = [];
  if (stats.pointsEarned==null||stats.pointsEarned==undefined)
    stats.pointsEarned = 0;
  if (stats.pointsGiven==null||stats.pointsGiven==undefined)
    stats.pointsGiven = 0;
  if (stats.matchesWon==null||stats.matchesWon==undefined)
    stats.matchesWon = 0;
  if (stats.matchesLost==null||stats.matchesLost==undefined)
    stats.matchesLost = 0;
  if (stats.skunks==null||stats.skunks==undefined)
    stats.skunks = 0;
  if (stats.skunked==null||stats.skunked==undefined)
    stats.skunked = 0;
  if (stats.sl==null||stats.sl==undefined)
    stats.sl = 3;
  // console.log("New Player: "+stats.name+' - '+stats.sl);
  this.name = stats.name;
  this.matches = stats.matches; // [[pointsEarned,pointsGiven,when]]
  this.pointsEarned = stats.pointsEarned;
  this.pointsGiven = stats.pointsGiven;
  this.matchesWon = stats.matchesWon;
  this.matchesLost = stats.matchesLost;
  this.mvp = (this.pointsEarned/(this.matchesWon+this.matchesLost));
  this.skunks = stats.skunks;
  this.skunked = stats.skunked;
  this.sl = stats.sl;
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
  this.players = data.players;
  this.opponents = data.opponents;
  this.matches = data.matches;
  this.locations = data.locations;
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