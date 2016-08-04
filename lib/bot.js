var colors = require("colors"),
    _ = require('underscore'),
    config = require('./config.js'),
    commands = require('./commands.js'),
    CronJob = require('cron').CronJob,
    HTTPS = require('https'),
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
var thoughts = [];

var bot = function() {
  // Updated when adding match stats
  // Updated during caching
  // this.commands = new Commands();
  // commands.activate.bind(this); 

  // commands.bind(this);
  // this.thoughts = [];
}

bot.prototype = {

  

  /*
    Boots up the bot after loading all data necessary for commands
      commands loads League data
  */
  boot : function() {
    var self = this;
    console.log('Booting up: '+config.botName);

    commands.load(function onLoad(err) {
      if (err) return think_(err);
      // loads current league data then syncs with ItIsWhatItIs sheet stats
      think_('League Loaded');
      self.cronJobber();
      // Initial scores update
      activate({command: "scores",argument:"boot"}, self.say);
      if (config.testing) 
        setTimeout(function() {self.test()},20000);
    });
  },

  /**
  * Called from index.js upon groupme posts
  * Runs activate(request) upon successful match
  */
  post : function() {
    // var self = this;
    if (self.req == undefined || self.req == null) 
      return;
    if (self.req.chunks == undefined || self.req.chunks == null) 
      return;
    var request = JSON.parse(self.req.chunks[0]);
    if (!request.text || !request.name || !request.id)
      return;
    console.log(request.name+": "+request.text);
    if (request.name === 'Gabriel' || request.name === 'Gabriel Martinez' || request.name.indexOf('Gab')>-1)
      return self.commands.activate({command:"dickeater"}, function(err, message) {
        if (err) return think_(err);
        self.say(message);
      });

    if (request.name===config.botName)
      return think_('Not talking to myself...');
    if (request.text.search(config.commandsRegex)!=-1) {
      var message = request.text || '',
          command = message.match(config.commandsRegex)[0],
          argument = message.match(config.argumentsRegex)[0];
      command = command.substring(1); // the first command match minus the slash
      if (argument!=undefined)
        message = message.substring(1+command.length+1+argument.length+1);
      else
        message = message.substring(1+command.length+1);
      request.command = command,
      request.argument = argument,
      request.text = message;
      activate(request, this.say);
    }
    self.res.writeHead(200);
    self.res.end();
  },

  // CronJobs
  cronJobber : function() {
    var self = this;
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
          self.commands.activate({command:'pregame'},function(err, message) {
            if (err) return think_(err);
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
            text: "quiet",
            command: "scores",
            argument: "update",
            name: config.name
          };
          self.commands.activate(update,function(err, message) {
            if (err) return think_(err);
            self.say(message);
          });
          self.commands.activate({command:'bottle',argument:'next'},function(err, message) {
            if (err) return think_(err);
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
  // say : function(thought) {
  //   var self = this;
  //   if (!config.responding) return think_('Not responding w/: '+thought);
  //   this.thoughts.push(thought);
  //   clearInterval(this.postman);
  //   this.postman = setInterval(function() {
  //     self.postMessage(self.thoughts.shift());
  //     if (self.thoughts.length===0) clearInterval(self.postman);
  //     // self.postMaster();
  //   }, config.responseTime);
  // },

  test : function() {
    var self = this;
    console.log('Running tests...');
    var tests = {
          text: "Summer Season 2016",
          command: "season",
          argument: "fresh",
          name: config.name
        },
        roundTwo = {
          text: "quiet",
          command: "scores",
          argument: "update",
          name: config.name
        };
    self.commands.activate(tests,function(err, message) {
      if (err) return think_(err);
      self.say(message);


      self.commands.activate(roundTwo,function(err, message) {
        if (err) return think_(err);
        self.say(message);

        self.saveTeamShitData();

      });

    });
  },

  say : function(err, thought) {
    var self = this;
    if (err) return think_(err);
    // var self = this;
    if (!config.responding) return think_('Not responding w/: '+thought);
    thoughts.push(thought);
    clearInterval(self.postman);
    self.postman = setInterval(function() {
      self.postMessage(thoughts.shift());
      if (thoughts.length===0) clearInterval(self.postman);
      // self.postMaster();
    }, config.responseTime);
  }

}

module.exports = bot;

function activate(what, callback) {
  commands.activate(what, callback);
}



function think_(what) {
  console.log(config.botName+': '+what);
}