var colors = require("colors"),
    _ = require('underscore'),
    Commands = require('./commands.js'),
    cool = require('cool-ascii-faces'),
    config = require('./config.js'),
    CronJob = require('cron').CronJob,
    GroupMe_API = require('groupme').Stateless,
    HTTPS = require('https'),
    moment = require ('moment'),
    util = require('util');

/**
 * @title Frybot
 * @author Schizo
 * @version 0.0.11
 */

/* To-do

update scores.mvp and scores.lvp to provide a less computerish response

On the starting of a new season, do newSeasonStuff() {
  announce a new season and its dates
  reset the sheets somehow, perhaps by affecting a cell that contains a date that the google scripts trigger off of
  introduce the players with introduce()
  remind returning players of past failures by using all of their stats to calculate those who got skunked the most
    offer to remove lowest player from the team
  wishes everyone (except nico) good luck

  introduce() {
    says random shit for each player in a WWE style intro
}
 
*/

var self; // weird behaviour workaround

var bot = function() {
  self = this;
  // Updated when adding match stats
  // Updated during caching
  this.commands = new Commands();
  this.thoughts = [];
}

bot.prototype = {

  /*
    Boots up the bot after loading all data necessary for commands
      commands loads League data
  */
  boot : function() {
    console.log('Booting up: '+config.name);
    this.commands.load(function onLoad(err) {
      if (err) return think_(err);
      self.cronJobber();
      // loads current league data then syncs with ItIsWhatItIs sheet stats
      var update = {
        text: "/scores update quiet",
        name: "Alex"
      };
      self.commands.activate(update, function(message) {
        self.say(message);
      });
      if (config.testing) 
        setTimeout(function() {self.test()},20000);
    });
  },

  /**
  * Called from index.js upon groupme posts
  * Runs activate(request) upon successful match
  */
  post : function() {
    if (this.req == undefined || this.req == null) 
      return;
    if (this.req.chunks == undefined || this.req.chunks == null) 
      return;
    var request = JSON.parse(this.req.chunks[0]);
    if (!request.text || !request.name || !request.id)
      return;
    if (request.name===config.name)
      return think_('Not talking to myself...');
    if (request.text.search(config.commandsRegex)!=-1) {
      console.log('command found in post: '+request.text);
      self.commands.activate(request,function(err,message) {
        if (err) return think_(err);
              likeMessage_(request.id);

        self.say(message);
      });
    }
    this.res.writeHead(200);
    this.res.end();
  },

  // CronJobs
  cronJobber : function() {
    var cronjobs = [];
    /**
    * Called weekly on Tuesday at 6:00 PM before 7:30 PM league match
    *  by index.js  
    *  
    * started- yes
    */
    self.pregameJob = new CronJob({
      cronTime: config.pregameJobTime,
        onTick: function() {
          self.commands.activate({command:'pregame'},function(message) {
            self.say(message);
          });
        },
        start: config.pregameJob,
        timeZone: 'America/Los_Angeles'
    });
    self.pregameJob.label = 'Pregame';
    self.pregameJob.started = config.pregameJob;
    cronjobs.push(self.pregameJob);

    /**
    * Called weekly on Wednesday at 12:00 PM
    *
    * started- yes
    */
    self.afterpartyJob = new CronJob({
      cronTime: config.afterpartyJobTime,
        onTick: function() {
          // messages about the nights game
          // did we win or lose
          // who did the best for the night
          // who did the worst for the night
          // commands.activate({command:'afterParty'});
          var update = {
            text: "/scores update quiet",
            name: config.name
          };
          self.commands.activate(update,function(message) {
            self.say(message);
          });
          self.commands.activate({command:'bottle',argument:'next'},function(message) {
            self.say(message);
          });
          // scores of all the other people who played
        },
        start: config.afterpartyJob,
        timeZone: 'America/Los_Angeles'
    });
    self.afterpartyJob.label = 'After Party';
    self.afterpartyJob.started = config.afterpartyJob;
    cronjobs.push(self.afterpartyJob);

    /**
    * Called once per season to start the new season off
    *     auto start for x weeks after end of previous season
          end of previous season determined by # of weeks?
    * started- maybe
    */
    self.newSeasonJob = new CronJob({
      cronTime: config.newSeasonJobTime,   // update to January 2nd, 2016
        onTick: function() {
          // to-do; all of this
          // messages about a hopeful new season
          // did we win last season
          // are we going to win this season
          // who is we, introduce all the players
          // create introduce() and timeoutdelay for each player
        },
        start: config.newSeasonJob,
        timeZone: 'America/Los_Angeles'
    });
    self.newSeasonJob.label = 'New Season';
    self.newSeasonJob.started = config.newSeasonJob;
    cronjobs.push(self.newSeasonJob);

    /**
    * Called once per season to start the new season off
    *
    * started- maybe
    */
    // this will probably ulimately be an array of cronjobs set to go off on specific holidays
    self.christmasJob = new CronJob({
      cronTime: config.christmasJobTime,
        onTick: function() {
          // to-do; more of this
          self.say('Merry Christmas Bitches!');
          // to-do; update this date to a dynamic system
          self.say('Don\'t forget- Spring Session starts on 1/2');
          self.say('And also...');
        },
        start: config.christmasJob,
        timeZone: 'America/Los_Angeles'
    });
    self.christmasJob.label = 'Christmas';
    self.christmasJob.started = config.christmasJob;
    cronjobs.push(self.christmasJob);

    // Prints out the started cronjobs
    // job.start not available from outside reference? might change away from self. to just variables, they'd run anyways
    _.forEach(cronjobs, function(job) {
      if (job.started)
        think_('started cronjob - '+job.label);
    });
  },


  // Prepares the thoughts_ to be POSTed based upon length
  postMaster : function() {
    if (!config.responding)
      return;
    // if (this.thoughts.length>1) {
    //   // thought string is checked for end of sentence chars
    //   // return their same thing
    //   // else return default sentence smash
    //   for (i=0;i<this.thoughts.length;i++) {
    //     if (this.thoughts[i]===undefined)
    //       continue;
    //     if ((this.thoughts[i].charAt(this.thoughts[i].length-1)!='!')&&(this.thoughts[i].charAt(this.thoughts[i].length-1)!='-')&&(this.thoughts[i].charAt(this.thoughts[i].length-1)!=':')&&(this.thoughts[i].charAt(this.thoughts[i].length-1)!=',')&&(this.thoughts[i].charAt(this.thoughts[i].length-1)!='.'))
    //       this.thoughts[i]+='. ';
    //     else
    //       this.thoughts[i]+=' '; 
    //   }
    //   this.thoughts = this.thoughts.join('');   
    //   this.postMessage(this.thoughts);
    //   // this.thoughts = [];
    // }
    // else
      this.postMessage(this.thoughts.shift());
    // this.thoughts = [];
  },

  

  /**
  * Posts the given message via the GroupMe bot
  * @param message
  */
  postMessage : function(message) {
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
    console.log('sending: \'' + message.green + '\' to [' + config.GroupMe_group_name+']');
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
  },

  /**
  * Adds a thought {string} to the this.thoughts {array} that will be POSTed
  * @param thought {string} what will be POSTed 
  */
  say : function(thought) {
    ;
    this.thoughts.push(thought);
    clearInterval(this.postman);
    this.postman = setInterval(function() {
      self.postMessage(self.thoughts.shift());
      if (self.thoughts.length===0) clearInterval(self.postman);
      // self.postMaster();
    }, config.responseTime);
  },

  test : function() {
    console.log('Running tests...');
    ;
    // var test = {
    //   text: '/bottle duty',
    //   name: 'Alex is Awesome'
    // };
    var tests = {
      command: 'pregame'
    };
    self.commands.activate(tests,function(message) {
      self.say(message);
    });
  }
}

module.exports = bot;

/**
* Likes the message with the given id
* @param {string} message_id - The message's id
*/
function likeMessage_(message_id) {GroupMe_API.Likes.create(config.GroupMe_AccessToken, config.GroupMe_group_ID, message_id, function(err,ret) {});};


function think_(what) {
  console.log(config.name+': '+what);
}