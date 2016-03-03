var _ = require('underscore'),
    config = require('./config.js'),
    fs = require('fs'),
    Spreadsheet = require('edit-google-spreadsheet');

var aws = require('aws-sdk');
aws.config.update({accessKeyId: config.AWS_ACCESS_KEY, secretAccessKey: config.AWS_SECRET_KEY});
var s3 = new aws.S3();

var EventEmitter = require('events').EventEmitter,
    events_ = new EventEmitter(); // likely to be phased out

var localSeasonsPath = './lib/seasons.json';


/*
  League Constructor

  Loads from S3 or locally
*/
function League(seasons, callback) {
  think_('League Created');
  var self = this;
  self.events = new EventEmitter();
  self.seasons = [];
  // Saves locally loaded data to S3
  if (config.localLoad&&!config.localSave)
    self.events.on('league data loaded', function() { 
      self.save();
    });
  // Data initialization
  var count = 0; // counts loaded seasons for completion
   // Load Completion
  // events_.on('season loaded', function() {
  //   count++;
  //   console.log('seasons: '+self.seasons.length);
  //   if (count===self.seasons.length)
  //     callback();
  //     // self.events.emit('league data loaded');
  // });
  _.forEach(seasons, function (season) {
    var newSeason = new Season(season, function() {
      count++;
      if (count===seasons.length)
        callback();
    });
    self.seasons.push(newSeason);
  });


  // self.load();
};

League.prototype = {
  /*
    Initializes the League's season data
  */
  load: function() {
    var self = this;
    self.seasons = []; // reset
    var count = 0; // counts loaded seasons for completion
    if (!config.localLoad) {
      think_('Loading League Data from S3');
      s3.getObject({ Bucket: config.S3_BUCKET, Key: config.AWS_SECRET_KEY }, function(err, data) {
        if (err) return think_(err);
        data = JSON.parse(data.Body.toString());
        // think_('loaded data: '+JSON.stringify(data));
        _.forEach(data.seasons, function (season) {
          self.seasons.push(new Season(season));
        });
        think_('League Data Loaded from S3');
      });
    }
    else {
      // Load seasons.json
      // think_('Loading League Data Locally');
      fs.readFile(localSeasonsPath, function read(err, data) {
        if (err) {throw err;}
        data = JSON.parse(data);
        // think_('loaded data: '+JSON.stringify(data));
        _.forEach(data.seasons, function (season) {
          self.seasons.push(new Season(season));      
        });
        think_('League Data Loaded Locally');
      });
    }
    // Load Completion
    events_.on('season loaded', function() {
      count++;
      if (count===self.seasons.length)
        self.events.emit('league data loaded');
    });
  },
  /*
    Saves the Leagues season data to S3 or locally
  */
  save: function() {
    think_('Saving League Data');
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
        if (err) return think_(err);
        // think_('saved: '+JSON.stringify(seasonData));
        think_('League Data Saved: s3');
      });
    else
      fs.writeFile(localSeasonsPath,JSON.stringify(seasonData, null, 4), function (err) {
        if (err) return think_(err);
        think_('League Data Saved: local');
      });
  },
  getCurrentSeason: function() {
    return this.seasons[0];
    // return this.seasons.getCurrent();
  },
  getSeasons: function() {
    return this.seasons;
  }
}

module.exports.League = League;

/*
  Location of each bar a match can be played at
*/
var homeLocation = 'The Copper Bucket';
function Location(data) {
  this.address = data.address || '';
  this.name = data.name || '';
}

Location.prototype = {
  isHome : function() {
    if (this.name===homeLocation)
      return true;
    return false;
  }
}

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
}

Game.prototype = {

}

/*
  Match
    individual matches
*/
function Match(data) {
  this.matchNumber = data.matchNumber || 0;
  // the players as a collection of stats tracked per match
  this.players = data.players || [
    {
      name: "Player One",
      team: "Team One",
      idNumber: 1,
      defenses: 0,
      pointsEarned: 1,
      pointsGiven: 0,
      SL: 3
    },
    {
      name: "Player Two",
      team: "Team Two",
      idNumber: 2,
      defenses: 0,
      pointsEarned: 0,
      pointsGiven: 0,
      SL: 3
    }
  ];
  if (this.players.length===1) {
    this.players.push(
      {
        name: "Player Two",
        team: "Team Two",
        idNumber: 2,
        defenses: 0,
        pointsEarned: 0,
        pointsGiven: 0,
        SL: 3
      }
    );
  }
  this.race = data.race || '2:2'; // todo: add race calculations
  this.games = data.games || [];
  this.winner = data.winner || this.determineWinner();
  think_('Match #'+this.matchNumber+': '+this.players[0].name+' vs '+this.players[1].name);
}

Match.prototype = {
  /*
    Compares score to determine winner
  */
  determineWinner : function() {
    if (this.players[0].pointsEarned>this.players[1].pointsEarned)
      this.winner = this.players[0];
    else
      this.winner = this.players[1];
  },
  /*
    Updates the corresponding player's score for the match
  */
  update : function(data) {
    // console.log('updating Match num: '+this.matchNumber);
    if (data.name==='Bye') {
      this.players[0].name = data.name;
      this.players[1].name = data.name;
    }
    if (this.players[0].name==='Player One')
      this.players[0].name = data.name;
    _.forEach(this.players, function(player) {
      if (player.name===data.name) {
        // console.log('updating match player: '+player.name);
        // player.defenses = data.defenses;
        player.pointsEarned = data.pointsEarned;
        player.pointsGiven = data.pointsGiven;
      }
    });
    this.determineWinner();
  }
}

/*
  MatchUp
    collections of 5 matches for a League night
*/
function MatchUp(data) {
  this.date = data.date || 'Never';
  this.location = data.location || 'Nowhere';
  this.opponent = data.opponent || 'Nobody';
  this.teams = data.teams || 'Empty MatchUp Teams';
  this.matches = [];
  // Existing match data is loaded, unnaccounted future matches prepped, matches scheduled but not played loaded and prepped
  var blip = '';
  if (data.matches) {
    for (i=0;i<data.matches.length;i++)
      this.matches.push(new Match(data.matches[i]));
    if (this.matches.length<5) {
      for (i=this.matches.length;i<5;i++)
        this.matches.push(new Match({matchNumber:i}));
      blip = ' and Prepped';
    }
    think_('MatchUp ('+this.date+') Loaded'+blip);
  }
  else {
    for (i=1;i<=5;i++) 
      this.matches.push(new Match({matchNumber:i}));
    think_('MatchUp ('+this.date+') Prepped');
  }
}

MatchUp.prototype = {
  updateMatches : function(updatedMatches) {
    // console.log('updating MatchUp: '+this.date);
    // console.log('this.matches: '+JSON.stringify(this.matches));
    // console.log('updatedMatches: '+JSON.stringify(updatedMatches));
    for (var i=0;i<this.matches.length;i++)
      for (var j=0;j<updatedMatches.length;j++)
        if (this.matches[i].matchNumber===updatedMatches[j].matchNumber)
          this.matches[i].update(updatedMatches[j]);
  }
}

/*
  Team
*/
function Team(data) {
  this.players = data.players || [];
  this.name = data.name || 'Blank Team';
  this.idNumber = data.idNumber || 0;
}

Team.prototype = {

}


/**
* Player Class
*  records name, matches (earned, given, match#), won, lost, skunks, skunked, sl
*
* @constructor
* @param stats {data} the data of the player in the format of {"name":name,"sl":sl,etc}
*/
function Player(data) {
  // think_("New Player: "+data.name+' - '+data.sl);
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
}

Player.prototype = {
  // MATCH
  addMatchStats: function(data) {
    var pointsEarned = data.pointsEarned || 0,
        pointsGiven = data.pointsGiven || 0,
        matchDate = data.matchDate || '2006-06-06',
        matchNum = data.matchNum || 0;
    this.matches.push([pointsEarned, pointsGiven, matchDate, matchNum]); // not used
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
}

module.exports.Player = Player;

/*
  Season
*/
var Season = function(data,callback) {
  var self = this;
  self.label = data.label || 'Blank';
  think_('Loading Season: '+self.label);
  // Players are recorded individually and within corresponding matches
  // loads available players from data.players
  // does not always already contain all participating players
  if (data.players) {
    self.players = [];
    for (i=0;i<data.players.length;i++)
      self.players.push(new Player(data.players[i]));
  }
  self.schedule = data.schedule;
  // Build from empty Player list or Schedule
  // todo: add ifSeasonIsCurrent when >1 season data
  if (!self.players||!self.schedule) {
    think_('Loading Players & Schedule');
    Spreadsheet.load({
      debug: false,
      spreadsheetId: config.Google_ItIsWhatItIs_Spreadsheet_ID,
      worksheetId: config.ItIsWhatItIs_referencesSheetID,
      worksheetName: 'references',
      oauth : config.Google_Oauth_Opts
    },
    function sheetReady(err, spreadsheet) {
      if(err) throw err;
      spreadsheet.receive(function(err, rows, info) {
        if(err) throw err;
        rows = _.toArray(rows);
        rows.shift();
        var playersAndSLs = [], 
            weeks = [];
        // Reads 'references' sheet for existing Players and Matchup Schedule
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
        think_('Players & Schedule Loaded');
        continue_();
      });
    });
  }
  else
    continue_();

  // Delayed in case of missing Players/Schedule
  function continue_() {
    var matchups = [];
    // Existing match data
    if (data.matchups)
      _.forEach(data.matchups, function (matchup) {
        matchups.push(new MatchUp(matchup));
      });
    // Future matches prepped with relevant schedule info
    // compares current matchups to total number scheduled
    if (matchups.length<self.schedule.length)
      for (i=matchups.length;i<self.schedule.length;i++)
        matchups.push(new MatchUp(self.schedule[i]));
    self.matchups = matchups;
    think_('Season - '+self.label+' - Loaded');
    events_.emit('season loaded');
    callback();
  }
}

Season.prototype = {
  // the most previous matchup
  getLastMatchup: function() {

  },
  /*
    Returns players names
  */
  getPlayersByNames : function() {
    var playersTemp = [];
    // think_('players: '+JSON.stringify(this.players));
    _.forEach(this.players, function (player) {
      playersTemp.push(player.name);
    });
    // think_('players: '+playersTemp);
    return playersTemp;
  },
  /*
    Returns the matchup for this week
  */
  getThisWeeksMatchup : function() {
    var today = new Date();
    // var day = today.getDate();
    // var month = today.getMonth();
    // think_('today: '+today+' is '+month+'/'+day);
    for (i=0;i<this.matchups.length;i++) {
      var matchDate = new Date(this.matchups[i].date);
      if (today===matchDate)
        return this.matchups[i];
      // var matchDay = matchDate.getDate();
      // var matchMonth = matchDate.getMonth();
      // think_('matchDate: '+matchDate+' is '+matchMonth+'/'+matchDay);
      // if ((day>=matchDay-3&&day<=matchDay+4)&&month===matchMonth) {
        // think_('found: '+matchMonth+'/'+matchDay);
        // return this.matchups[i];
      // }
    }
  },
  setPlayers : function(players) {
    this.players = players;
  },
  /*
    Updates match data from a provided array of matches
  */
  updateMatchups : function(matchups) {
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
    for (p=0;p<this.players.length;p++)
      for (i=0;i<matchups.length;i++)
        for (j=0;j<matchups[i].length;j++)
          if (matchups[i][j].name===this.players[p].name) 
            this.players[p].addMatchStats(matchups[i][j]);
  }
}

function think_(what) {
  if (config.debugging_League) console.log('League: '+what);
}




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