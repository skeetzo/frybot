var colors = require("colors"),
    _ = require('underscore'),
    HTTPS = require('https'),
    util = require('util'),
    config = require('./config/index'),
    logger = config.logger,
    Player = require('./models/player'),
    Season = require('./models/season'),
    Team = require('./models/team'),
    Sheets = require('./mods/sheets'),
    async = require('async'),
    fs = require('fs');
    
/**
 * @title Frybot
 * @author Skeetzo
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

var bot = function() {
  this.thinking = [];
  this.saying = [];
}

bot.prototype = {

  activate : function(request) {
    // console.log('commands');
    var command = request.command || '',
        argument = request.argument || '',
        message = request.text || '',
        sender = request.name || '',
        modifiers = request.modifiers || {};
        request.message = message;
    // console.log('command: '+command+'['+argument+'] of '+sender+': \''+message+'\'');
    if (typeof this.commands[command] === "function" ) {
      logger.log('Activating: %s[%s] of %s: \'%s\'',command.green,argument.cyan,sender.yellow,message);
      if (request.id) this.commands.likeMessage.call(this,request.id);
      this.commands[command].call(this,{argument:argument,message:message,sender:sender,modifiers:modifiers});
    }
    else logger.warn('No command found');
  },

  /*
    Boots up the bot after loading all data necessary for commands
      commands loads League data
  */
  boot : function() {
    var self = this;
    logger.log('Booting up: '+config.botName);

    // Core
    require('./core/index.js').load.call(this);
    // Mods
    require('./mods/index.js').load.call(this);
    // Cmds
    require('./cmds/index.js').load.call(this);

    if (!this.commands) return console.log("Error- missing critical Commands module");  

    // loads current season data then syncs with ItIsWhatItIs sheet stats
    async.waterfall([
      function(next) {
        Season.getCurrentSeason(function(err, season) {
          if (err) logger.warn(err);
          if (!season) {
            logger.log('Configuring New Season');
            season = new Season({'active':true})
            season.save(function(err) {
              if (err) logger.warn(err);
              next(null, season);
            });
          }
          else
            next(null, season);
        })
      },
      function(season, next) {
        // taco
        if (season.schedule) return next(null, season);
        logger.log('Configuring Season Schedule');
        Sheets.loadSchedule(function(err, schedule) {
          if (err) logger.warn(err);
          var finished;
          season.schedule = new Schedule({'label':season.label});
          _.forEach(schedule,function (week) {
            Matchup.findOneAndUpdate({'date':week.matchDate},week,{'upsert':true,'new':true}, function (err, matchup) {
              if (err) logger.warn(err);
              logger.log('Matchup Prepped: %s',matchup.date)
              season.schedule.matchups.push(matchup);
              clearTimeout(finished);
              finished = setTimeout(finish,3000);
            });
          });
          var finish = function() {
            season.schedule.save(function(err) {
              if (err) logger.warn(err);
              next(null, season);
            });
          }
        });
      },
      function(season, next) {
        logger.log('Configuring Teams');
        Team.findOne({'name':config.homeTeam},function (err, team) {
          if (err) return next(err);
          // home team found
          if (team) return next(null, season, team);
          // if missing home team
          Team.addHome(config.homeTeam, function(err, team) {
            if (err) return next(err);
            next(null, season, team);
          });
        });
      },
      function(season, team, next) {
        team.home = true;
        team.save(function (err) {
          if (err) logger.warn(err);
          logger.log('Home Team: %s',team.name);
          season.addTeam(team, function(err) {
            if (err) logger.warn(err);
            next(null);
          });
        });
      },
      function(next) {
        self.activate.call(self,{command:"scores",argument:"boot",name:config.botName});
        if (config.cronjobbing) self.cronjobs.start.call(self);
        else logger.debug('Crons Disabled');
        if (self.twitter)
          self.twitter.connect.call(self,function(err) {
            if (err) return logger.warn(err);
          });
        if (config.testing) setTimeout(function() {self.test()},20000);
      }
    ], function(err) {
      if (err) logger.warn(err);
    });
    
},

  /**
  * Called from index.js upon groupme posts
  * Runs activate(request) upon successful match
  */
  onGroupMePost : function(req, res) {
    var self = this;
    if (!req||!req.body) return logger.warn('Missing GroupMe message data');
    var request = req.body;
    if (request.name.toLowerCase()===config.botName.toLowerCase()) return logger.debug('Not talking to myself...');
    logger.log(request.name.yellow+": "+request.text);

    // Check for Nicofact addition
    if (~request.text.toLowerCase().search('nico fact #')) {
      var addNicoFact = {
          text: request.text,
          command: "nicofacts",
          argument: "addNicoFact",
          name: config.name
        }
      self.activate.call(self,addNicoFact,function(err) {
        if (err) return logger.warn(err);
      });
    }

    // Check for commands
    if (request.text.search(config.commandsRegex)!=-1&&request.text.charAt(0)=='/') {
      var message = request.text || '',
          command = message.match(config.commandsRegex)[0],
          argument = message.match(config.argumentsRegex);
      if (argument&&argument.length>0) argument = argument[0];
      command = command.substring(1); // the first command match minus the slash
      if (argument!=undefined) {
        message = message.substring(1+command.length+1+argument.length+1);
        argument = argument.substring(1); // the first argument match minus the dash
      }
      else
        message = message.substring(1+command.length+1);
      request.command = command,
      request.argument = argument,
      request.text = message;
      self.activate.call(self,request);
    }
    res.writeHead(200);
    res.end();
  },

  /**
  * Posts the given message via the GroupMe bot
  * @param message
  */
  postGroupMeMessage : function(message) {
    if (!message) return logger.warn('Missing message to post: %s',message);
    var self = this;
    logger.log('Sending: \'%s\' to [%s]',message.green,config.GroupMe_group_name.yellow);
    var options = {
          hostname: 'api.groupme.com',
          path: '/v3/bots/post',
          method: 'POST'
        },
        body = {
          "bot_id" : config.botID,
          "text" : message
        },
        botReq = HTTPS.request(options, function(res) {
          if(res.statusCode == 202) {
            // neat, why is this even here?
          } else {
            logger.warn('rejecting bad status code: %s',res.statusCode);
          }
        });
    botReq.on('error', function(err) {
      logger.warn('error posting message: %s',JSON.stringify(err));
    });
    botReq.on('timeout', function(err) {
      logger.warn('timeout posting message: %s',JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
  },

  postGroupMeMessageDev : function(message) {
    var self = this;
    if (!message) return logger.warn('Missing message to post: %s',message);
    logger.log('Sending: \'%s\' to [%s]',message.green,config.GroupMe_group_name);
    var options = {
          hostname: 'api.groupme.com',
          path: '/v3/bots/post',
          method: 'POST'
        },
        body = {
          "bot_id" : config.GroupMe_devbot_ID,
          "text" : message
        },
        botReq = HTTPS.request(options, function(res) {
          if(res.statusCode == 202) {
            // neat, why is this even here?
          } else {
            logger.warn('rejecting bad status code: %s',res.statusCode);
          }
        });
    botReq.on('error', function(err) {
      logger.warn('error posting message: %s',JSON.stringify(err));
    });
    botReq.on('timeout', function(err) {
      logger.warn('timeout posting message: %s',JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
  },

  /**
  * Adds a thought {string} to the this.saying {array} that will be POSTed
  * @param thought {string} what will be POSTed 
  */
  say : function(message) {
    var self = this;
    if (!config.responding) return logger.debug('Not responding w/: '+message);
    if (config.debugging) {
      // send through debugging instead
      self.think.call(self,message);
      return;
    }
    self.saying.push(message);
    clearInterval(self.postman);
    self.postman = setInterval(function() {
      self.postGroupMeMessage(self.saying.shift());
      if (self.saying.length===0) clearInterval(self.postman);
    }, config.responseTime);
  },

  test : function() {
    var self = this;
    logger.log('Running tests...');
    // var newSeasonTests = [{
    //       text: "Spring Season 2017",
    //       command: "season",
    //       argument: "fresh",
    //       name: config.name
    //     },
    //     roundTwo = {
    //       text: "quiet",
    //       command: "scores",
    //       argument: "update",
    //       name: config.name
    //     }];

    var tests = [{
          text: "",
          command: "season",
          argument: "pregame",
          name: config.name
        }];
        // ,
        // roundTwo = {
        //   text: "",
        //   command: "season",
        //   argument: "afterparty",
        //   name: config.name
        // }];

    _.forEach(tests, function(test) {
      setTimeout(function lazyDelay() {
        self.activate.call(self,test,function(err) {
          if (err) return logger.warn(err);
        })
      },10000);
    });
  },

  think : function(message) {
    var self = this;
    if (!config.responding) return logger.debug('Not responding thought w/: '+message);
    self.thinking.push(message);
    clearInterval(self.postman);
    self.postman = setInterval(function() {
      self.postGroupMeMessageDev(self.thinking.shift());
      if (self.thinking.length===0) clearInterval(self.postman);
    }, config.responseTime);
  }

}

module.exports = bot;
