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

var bot = function() {
  var self_ = this;
  // Lock
  var thinking = false;
  // Updated when adding match stats
  var lastMatchNum_ = 0;
  // Updated during caching
  var all_players_ = [];
  var all_matches_ = [];
  var league;

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
  function say(thought) {
    thoughts_.push(thought);
    clearTimeout(postman);
    postman = function() {
      postMaster_();
    }
    setTimeout(postman, config.responseTime);
  };
  this.say = say;
  

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
 
  // Boot
  bot.prototype.boot = function() {
    console.log('Booting up: '+config.name);
    league = new League();
    var update = {
      text: "/scores update",
      name: "Alex"
    };
    setTimeout(commands.activate(update),6000);
  };
  // Main
  this.main = function() {
    console.log('Main Party Starting');

  };
}

// var Bot = new bot();

util.inherits(bot, EventEmitter);

// var Bot = new bot();
module.exports.bot = bot;

module.exports.say = bot.say;
