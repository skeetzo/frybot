var colors = require("colors"),
    _ = require('underscore'),
    HTTPS = require('https'),
    util = require('util'),
    fs = require('fs');
    
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

var bot = function(config) {
  this.config = config;
  this.logger = config.logger;
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
      this.logger.log('Activating: %s[%s] of %s: \'%s\'',command.green,argument.cyan,sender.yellow,message);
      if (request.id) this.commands.likeMessage.call(this,request.id);
      this.commands[command].call(this,{argument:argument,message:message,sender:sender,modifiers:modifiers});
    }
    else this.logger.warn('No command found');
  },

  /*
    Boots up the bot after loading all data necessary for commands
      commands loads League data
  */
  boot : function() {
    var self = this;
    self.logger.log('Booting up: '+self.config.botName);

    // Core
    require('./core/index.js').load.call(this);
    // Mods
    require('./mods/index.js').load.call(this);
    // Cmds
    require('./cmds/index.js').load.call(this);

    // update AWS config
    this.commands.updateAWS.call(this);

    if (!this.commands) return console.log("Error- missing critical Commands module");  

    self.commands.loadLeague.call(self,function onLoad(err) {
      if (err) return self.logger.error(err);
      // loads current league data then syncs with ItIsWhatItIs sheet stats
      self.logger.debug('League Loaded');
      // Initial scores update on boot
      // self.commands.loadModules.call(self);
      self.activate.call(self,{command:"scores",argument:"boot",name:self.config.botName});
      if (self.config.cronjobbing) self.cronjobs.start.call(self);
      else self.logger.debug('Crons Disabled');
      
      
      if (self.twitter)
        self.twitter.connect.call(self,function(err) {
          if (err) return self.logger.warn(err);

        });
      if (self.config.testing) setTimeout(function() {self.test()},20000);
    });
  },

  /**
  * Called from index.js upon groupme posts
  * Runs activate(request) upon successful match
  */
  onGroupMePost : function(req, res) {
    var self = this;
    if (!req||!req.body) return self.logger.warn('Missing GroupMe message data');
    var request = req.body;
    if (request.name.toLowerCase()===self.config.botName.toLowerCase()) return self.logger.debug('Not talking to myself...');
    self.logger.chat(request.name.yellow+": "+request.text);

    // Check for Nicofact addition
    if (~request.text.toLowerCase().search('nico fact #')) {
      var addNicoFact = {
          text: request.text,
          command: "nicofacts",
          argument: "addNicoFact",
          name: self.config.name
        }
      self.activate.call(self,addNicoFact,function(err) {
        if (err) return self.logger.warn(err);
      });
    }

    // Check for commands
    if (request.text.search(self.config.commandsRegex)!=-1&&request.text.charAt(0)=='/') {
      var message = request.text || '',
          command = message.match(self.config.commandsRegex)[0],
          argument = message.match(self.config.argumentsRegex);
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
    if (!message) return self.logger.warn('Missing message to post: %s',message);
    var self = this;
    self.logger.log('Sending: \'%s\' to [%s]',message.green,self.config.GroupMe_group_name.yellow);
    var options = {
          hostname: 'api.groupme.com',
          path: '/v3/bots/post',
          method: 'POST'
        },
        body = {
          "bot_id" : self.config.botID,
          "text" : message
        },
        botReq = HTTPS.request(options, function(res) {
          if(res.statusCode == 202) {
            // neat, why is this even here?
          } else {
            self.logger.warn('rejecting bad status code: %s',res.statusCode);
          }
        });
    botReq.on('error', function(err) {
      self.logger.warn('error posting message: %s',JSON.stringify(err));
    });
    botReq.on('timeout', function(err) {
      self.logger.warn('timeout posting message: %s',JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
  },

  postGroupMeMessageDev : function(message) {
    var self = this;
    if (!message) return self.logger.warn('Missing message to post: %s',message);
    self.logger.log('Sending: \'%s\' to [%s]',message.green,self.config.GroupMe_group_name);
    var options = {
          hostname: 'api.groupme.com',
          path: '/v3/bots/post',
          method: 'POST'
        },
        body = {
          "bot_id" : self.config.GroupMe_devbot_ID,
          "text" : message
        },
        botReq = HTTPS.request(options, function(res) {
          if(res.statusCode == 202) {
            // neat, why is this even here?
          } else {
            self.logger.warn('rejecting bad status code: %s',res.statusCode);
          }
        });
    botReq.on('error', function(err) {
      self.logger.warn('error posting message: %s',JSON.stringify(err));
    });
    botReq.on('timeout', function(err) {
      self.logger.warn('timeout posting message: %s',JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
  },

  /**
  * Adds a thought {string} to the this.saying {array} that will be POSTed
  * @param thought {string} what will be POSTed 
  */
  say : function(message) {
    var self = this;
    if (!self.config.responding) return self.logger.debug('Not responding w/: '+message);
    if (self.config.debugging) {
      // send through debugging instead
      self.think.call(self,message);
      return;
    }
    self.saying.push(message);
    clearInterval(self.postman);
    self.postman = setInterval(function() {
      self.postGroupMeMessage(self.saying.shift());
      if (self.saying.length===0) clearInterval(self.postman);
    }, self.config.responseTime);
  },

  test : function() {
    var self = this;
    self.logger.log('Running tests...');
    // var newSeasonTests = [{
    //       text: "Spring Season 2017",
    //       command: "season",
    //       argument: "fresh",
    //       name: self.config.name
    //     },
    //     roundTwo = {
    //       text: "quiet",
    //       command: "scores",
    //       argument: "update",
    //       name: self.config.name
    //     }];

    var tests = [{
          text: "",
          command: "nicofacts",
          argument: "tweetnicofact",
          name: self.config.name
        }];
        // ,
        // roundTwo = {
        //   text: "",
        //   command: "season",
        //   argument: "afterparty",
        //   name: self.config.name
        // }];

    _.forEach(tests, function(test) {
      setTimeout(function lazyDelay() {
        self.activate.call(self,test,function(err) {
          if (err) return self.logger.warn(err);
        })
      },10000);
    });
  },

  think : function(message) {
    var self = this;
    if (!self.config.responding) return self.logger.debug('Not responding thought w/: '+message);
    self.thinking.push(message);
    clearInterval(self.postman);
    self.postman = setInterval(function() {
      self.postGroupMeMessageDev(self.thinking.shift());
      if (self.thinking.length===0) clearInterval(self.postman);
    }, self.config.responseTime);
  }

}

module.exports = bot;