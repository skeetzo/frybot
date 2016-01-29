var cache = require('./cache.js');
var colors = require("colors");
var _ = require('underscore');
var commands = require('./commands.js');
var cool = require('cool-ascii-faces');
var config = require('./config.js');
var CronJob = require('cron').CronJob;
var EventEmitter = require('events').EventEmitter;
var HTTPS = require('https');
var League = require('./league.js').League;
var moment = require ('moment');
var Player = require('./league.js').Player;
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
var self_;

  var league;

var bot = function() {
  self_ = this;
  // Lock
  var thinking = false;
  // Updated when adding match stats
  var lastMatchNum_ = 0;
  // Updated during caching
  var all_players_ = [];
  var all_matches_ = [];

  // Posts



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
  

  bot.prototype.test = function() {
    // var request = {
    //   text: "/scores update",
    //   name: "Alex"
    // };
    // commands.activate(request);

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
 

  // Main
  this.main = function() {
    console.log('Main Party Starting');

  };

   // Boot
  bot.prototype.boot = function() {
    console.log('Booting up: '+config.name);
    league = new League(undefined,function onLoad() {
      console.log('League data loaded');
      var update = {
        text: "/scores update quiet",
        name: "Alex"
      };
      var test = {
        text: '/nicofacts',
        name: 'Nico'
      }
      setTimeout(function() {commands.activate(test)}, 10000);
      setTimeout(function() {commands.activate(update)},5000);
    });
  };
};

 




// var Bot = new bot();

util.inherits(bot, EventEmitter);

// var Bot = new bot();
module.exports = bot;


