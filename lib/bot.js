require("colors");
var _ = require('underscore');
var commands = require('./commands.js');
var cool = require('cool-ascii-faces');
var config = require('./config.js');
var CronJob = require('cron').CronJob;
var EventEmitter = require('events').EventEmitter;
var GroupMe_API = require('groupme').Stateless;
var HTTPS = require('https');
var moment = require ('moment');
var Spreadsheet = require('edit-google-spreadsheet');
var util = require('util');

/**
 * @title It Is What It Is GroupMe Bot, Frybot
 * @author Schizo
 * @version 0.0.6
 */

/* To-do

calling recent stats by season etc by name like a real db 

update scores.mvp and scores.lvp to provide a less computerish response

On the starting of a new season, do newSeasonStuff() {
  announce a new season and its dates
  reset the sheets somehow, perhaps by affecting a cell that contains a date that the google scripts trigger off of
  introduce the players with introduce()
  remind returning players of past failures by using all of their stats to calculate those who got skunked the most
    offer to remove lowest player from the team
  wishes everyone (except nico) good luck

add the (commander) lock  
  and (master) lock

  introduce() {
  says random shit for each player in a WWE style intro
}
 
*/

var bot = function() {
  var self_ = this;
  // Lock
  var thinking = false;
  // Updated when adding match stats
  var lastMatchNum_ = 0;
  // Updated during caching
  var all_players_ = [];
  var all_matches_ = [];

  // Posts

  /**
  * Likes the message with the given id
  * @param {string} message_id - The message's id
  */
  function likeMessage_(message_id) {GroupMe_API.Likes.create(config.GroupMe_AccessToken, config.GroupMe_group_ID, message_id, function(err,ret) {});};

  /**
  * Called from index.js upon groupme posts
  * Runs activate(request) upon successful match
  */
  bot.prototype.post = function() {
    if (this.req == undefined || this.req == null) 
      return;
    if (this.req.chunks == undefined || this.req.chunks == null) 
      return;
    var request = JSON.parse(this.req.chunks[0]);
    if (!request.text || !request.name || !request.id)
      return;
    if (request.name==config.NAME)
      return;
    if (request.text.search(config.commandsRegex)!=-1) 
      commands.activate(request);
    this.res.writeHead(200);
    this.res.end();
  };

  // Prepares the thoughts_ to be POSTed based upon length
  function postMaster_() {
    if (!config.responding)
      return;
    if (thoughts_.length>=3) {
      // thought string is checked for end of sentence chars
      // return their same thing
      // else return default sentence smash
      for (i=0;i<thoughts_.length;i++) {
        if (thoughts_[i]===undefined)
          continue;
        if ((thoughts_[i].charAt(thoughts_[i].length-1)!='!')&&(thoughts_[i].charAt(thoughts_[i].length-1)!='-')&&(thoughts_[i].charAt(thoughts_[i].length-1)!=':')&&(thoughts_[i].charAt(thoughts_[i].length-1)!=',')&&(thoughts_[i].charAt(thoughts_[i].length-1)!='.'))
          thoughts_[i]+='. ';
        else
          thoughts_[i]+=' '; 
      }
      thoughts_ = thoughts_.join('');   
      postMessage_(thoughts_);
      // thoughts_ = [];
    }
    else
      postMessage_(thoughts_.shift());
    thoughts_ = [];
  };

  /**
  * Posts the given message via the GroupMe bot
  * @param message
  */
  function postMessage_(message) {
    var options, body, botReq;
    options = {
      hostname: 'api.groupme.com',
      path: '/v3/bots/post',
      method: 'POST'
    };
    body = {
      "bot_id" : config.botID,
      "text" : message
    };
    if (message==undefined)
      return;
    console.log(('sending ' + message + ' to ' + config.botID).green);
    botReq = HTTPS.request(options, function(res) {
        if(res.statusCode == 202) {
          // neat, why is this even here?
        } else {
          console.log('rejecting bad status code ' + res.statusCode);
        }
    });
    botReq.on('error', function(err) {
      console.log('error posting message '  + JSON.stringify(err));
    });
    botReq.on('timeout', function(err) {
      console.log('timeout posting message '  + JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
  };

  /**
  * Adds a thought {string} to the thoughts_ {array} that will be POSTed
  * @param thought {string} what will be POSTed 
  */
  var thoughts_ = []; // the thoughts_ to be posted
  var postman = function() {};
  bot.prototype.postThought_ = function(thought) {
    thoughts_.push(thought);
    clearTimeout(postman);
    postman = function() {
      postMaster_();
    }
    setTimeout(postman, config.responseTime);
  };

  // all_players_ and all_matches_ cacher
  /**
  * Resets Player scores for the season
  *  Resets Array of the season's match data
  *
  * @param function callback the function to be called once done loading and reading the sheet and updating the arrays
  */
  function cachePlayers_(callback) {
    console.log('Caching Players from Scoresheet');
    thinking = true;
    all_players_ = [];
    all_matches_ = [];
    Spreadsheet.load({
      debug: true,
      spreadsheetId: config.ItIsWhatItIs_Spreadsheet_ID,
      worksheetId: config.ItIsWhatItIs_statsSheetID,
      oauth : {
        email: config.Frybot_Google_ServiceEmail,
        key: config.Frybot_Google_key
      }
    },
    function sheetReady(err, spreadsheet) {
      if(err) {
        console.log(err);
        throw err;
      }
      spreadsheet.receive(function(err, rows, info) {
        if(err) throw err;
        // header pickoff
        var once = true;
        var keys = '{"player":"","pointsEarned":"","pointsGiven":"","matchNumber":"","matchDate":""}';
        _.forEach(rows, function(row) {
            if (once) {
              once = false;
            }
            else {
              var match = JSON.parse(keys);
              // match = JSON.parse(match);
              match.player = row[1];
              match.pointsEarned = row[2];
              match.pointsGiven = row[3];
              match.matchNumber = row[4];
              lastMatchNum_ = row[4];
              match.matchDate = row[5];
              // console.log('match: '+JSON.stringify(match));
              // Adds to array of JSON of all matches
              all_matches_.push(match);
              // Adds the Player if new, updates scores afterwards
              if (all_players_.length==0) {
                // console.log('Adding the first player: '+match.player);
                var newPlayer = new Player({"name":match.player})
                newPlayer.addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                all_players_.push(newPlayer);
              }
              else {
                var found = false;
                for (j=0;j<all_players_.length;j++) 
                  if (all_players_[j].name==match.player) {
                    // console.log('Found player: '+match.player);
                    found = true;
                    all_players_[j].addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                  }
                if (!found) {
                  // console.log('Adding new player: '+match.player);
                  var newPlayer = new Player({"name":match.player})
                  newPlayer.addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                  all_players_.push(newPlayer);
                }
              }
            }
        });
        self_.emit('cache loaded');
        if (callback)
          callback();
      });
    });
  }

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
    this.name = stats.name || 'Default';
    this.matches = stats.matches || []; // [[pointsEarned,pointsGiven,when]]
    this.pointsEarned = stats.pointsEarned || 0;
    this.pointsGiven = stats.pointsGiven || 0;
    this.matchesWon = stats.matchesWon || 0;
    this.matchesLost = stats.matchesLost || 0;
    this.mvp = (this.pointsEarned/(this.matchesWon+this.matchesLost));
    this.skunks = stats.skunks || 0;
    this.skunked = stats.skunked || 0;
    this.sl = stats.sl || 3;
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

  bot.prototype.test = function() {
    var request = {
      text: "/scores update",
      name: "Alex"
    };
    commands.activate(request);
  };

  // CronJobs

  /**
  * Called weekly on Tuesday at 6:00 PM before 7:30 PM league match
  *  by index.js  
  *  
  * started- yes
  */
  var pregameJob_ = new CronJob({
    cronTime: '00 00 18 * * 2',
      onTick: function pregame() {
        var location = 'The Copper Bucket';
        self_.postThought_('It\'s League night bitch niggas!');
        self_.postThought_('Playing @ '+location);
        self_.bottle('duty');
        self_.postThought_('Don\'t fuck up!');
      },
      start: true,
      timeZone: 'America/Los_Angeles'
  });

  /**
  * Called weekly on Wednesday at 12:00 PM
  *
  * started- yes
  */
  var afterpartyJob_ = new CronJob({
    cronTime: '00 39 12 * * 4',
      onTick: function() {
        // messages about last nights game
        // did we win or lose
        // who did the best for the night
        // who did the worst for the night
        self_.postThought_('Results from yesterday\'s game-');
        // scores of all the other people who played
      },
      start: false,
      timeZone: 'America/Los_Angeles'
  });

  /**
  * Called once per season to start the new season off
  *
  * started- maybe
  */
  var newSeasonJob_ = new CronJob({
    cronTime: '00 05 21 * * 3',   // update to January 2nd, 2016
      onTick: function() {
        // to-do; all of this
        // messages about a hopeful new season
        // did we win last season
        // are we going to win this season
        // who is we, introduce all the players
        // create introduce() and timeoutdelay for each player
      },
      start: false,
      timeZone: 'America/Los_Angeles'
  });
  // add a (if after date) then don't start else start

  /**
  * Called once per season to start the new season off
  *
  * started- maybe
  */
  // this will probably ulimately be an array of cronjobs set to go off on specific holidays
  var christmasJob_ = new CronJob({
    cronTime: '00 00 09 25 11 *',          // this needs to be done dynamically
      onTick: function() {
        // to-do; more of this
        self_.postThought_('Merry Christmas Bitches!');
        // to-do; update this date to a dynamic system
        self_.postThought_('Don\'t forget- Spring Session starts on 1/2');
        self_.postThought_('And also...');
        self_.scores('mvp');
        self_.scores('lvp');
      },
      start: true,
      timeZone: 'America/Los_Angeles'
  });

  self_.once('cache loaded', function() {
    // to-do; add in a redundancy check, maybe not for this function but to catch after a crash
    console.log('Cache Loaded');
    if (config.debugging) {
      console.log('Running Tests'.red);
      self_.test();
    }
    else
      self_.main();
  });

  self_.on('uncaughtException', function (er) {
    console.log('Gotcha! Uhh: '+er);
    console.log('Let\'s try this again...');
    self_.main();

  });
 
  // Boot
  (function boot() {
    console.log('Booting up: '+config.name);
    setTimeout(cachePlayers_,3000);
  })();
  // Main
  this.main = function() {
    console.log('Main Party Starting');

  };
}

var Bot = new bot();
bot = new bot();

util.inherits(bot, EventEmitter);

module.exports = bot;
