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
  }
  getName : function() {
    return this.name;
  }
  isHome : function() {
    if (this.name===homeLocation)
      return true;
    else
      return false;
  }
};

module.exports.Location = Location;

// boots up the league by 
function League(data) {

  this.seasons;
  // load all seasons from a json file
  this.currentSeason;
  
  this.players;
  // load all players from a json file
  this.currentPlayers;

  this.locations;
  this.currentLocations;


};

League.prototype = {



  toString: function() {
    var returned = [];
    returned.push("{ Name: "+this.name);

    return returned.toString();
  }
};

var seasons = []; // an array of all the recorded Seasons
var Season = function() {
  this.label;
  this.year;
  this.
}
Season.prototype = {

};
