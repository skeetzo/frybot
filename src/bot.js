var colors = require("colors"),
    _ = require('underscore'),
    config = require('./config.js'),
    commands = require('./commands.js'),
    CronJob = require('cron').CronJob,
    HTTPS = require('https'),
    util = require('util'),
    fs = require('fs'),
    logger = require('tracer').colorConsole(
                {
                    format : [
                          "{{timestamp}} <{{title}}> {{message}} (in {{file}}:({{method}}):{{line}})", //default format
                          {
                              error : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:({{method}}):{{line}})\nCall Stack:\n{{stack}}" // error format
                          }
                    ],
                    dateformat : "HH:MM:ss.L",
                    preprocess :  function(data){
                        data.title = data.title.toUpperCase();
                    },
                    transport : [
                        function (data) {
                            console.log(data.output);
                        },
                        function (data) {
                            if (process.NODE_ENV == 'production') return;        
                            fs.appendFile('./file.log', data.output + '\n');
                        },
                        function (data) {
                            if (process.NODE_ENV != 'production') return;        
                            var stream = fs.createWriteStream("./stream.log", {
                                flags: "a",
                                encoding: "utf8",
                                mode: 0666
                            }).write(data.output+"\n");
                        }
                        }]
                });

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
  this.thoughts = [];
  this.logger = logger;
  this.boot.call(this);
}

bot.prototype = {

  activate : function(what) {
    var command = what.command || '',
        argument = what.argument || '',
        message = what.text || '',
        sender = what.name || '';
    if (typeof commands[command] === "function" ) {
      self.logger.log('Activating: '+command+'['+argument+'] of '+sender+': \''+message+'\'');
      if (what.id) commands.likeMessage(what.id);
      var request = {command:command,argument:argument,message:message,sender:sender};
      commands[command].call(this,request);
      // likeMessage_(sender);
    }
    else
      self.logger.debug('No command found');


  },

  /*
    Boots up the bot after loading all data necessary for commands
      commands loads League data
  */
  boot : function() {
    var self = this;
    console.log('Booting up: '+self.config.botName);
    commands.load.call(self,function onLoad(err) {
      if (err) return self.logger.error(err);
      // loads current league data then syncs with ItIsWhatItIs sheet stats
      self.logger.debug('League Loaded');
      // Initial scores update on boot
      self.activate.call(self,{command: "scores",argument:"boot",name:config.botName});
      if (self.config.cronjobbing) CronJob.start.call(self);
      if (config.testing) setTimeout(function() {self.test()},20000);
    });
  },

  /**
  * Called from index.js upon groupme posts
  * Runs activate(request) upon successful match
  */
  post : function() {
    var self = this;
    if (self.req == undefined || self.req == null) return;
    if (self.req.chunks == undefined || self.req.chunks == null) return;
    var request = JSON.parse(self.req.chunks[0]);
    if (!request.text || !request.name || !request.id) return;
    self.logger.log(request.name+": "+request.text);
    if (request.name===config.botName) return self.logger.debug('Not talking to myself...');
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
      // console.log('this: '+self.toString());
      self.activate.call(self,request);
    }
    self.res.writeHead(200);
    self.res.end();
  },

  /**
  * Posts the given message via the GroupMe bot
  * @param message
  */
  postMessage : function(message) {
    var self = this;
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
    if (message==undefined) return;
    self.logger.log('Sending: \'%s\' to [%s]',message.green,self.config.GroupMe_group_name);
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
  * Adds a thought {string} to the this.thoughts {array} that will be POSTed
  * @param thought {string} what will be POSTed 
  */
  say : function(thought) {
    var self = this;
    if (!self.config.responding) return self.logger.debug('Not responding w/: '+thought);
    self.thoughts.push(thought);
    clearInterval(self.postman);
    self.postman = setInterval(function() {
      self.postMessage(self.thoughts.shift());
      if (self.thoughts.length===0) clearInterval(self.postman);
    }, self.config.responseTime);
  },

  test : function() {
    var self = this;
    self.logger.log('Running tests...');
    var tests = {
          text: "Summer Season 2016",
          command: "season",
          argument: "fresh",
          name: self.config.name
        },
        roundTwo = {
          text: "quiet",
          command: "scores",
          argument: "update",
          name: self.config.name
        };
    self.commands.activate.call(self,tests,function(err, message) {
      if (err) return think_(err);
      self.say(message);


      self.commands.activate.call(self,roundTwo,function(err, message) {
        if (err) return think_(err);
        self.say.call(self,message);

        // self.saveTeamShitData();

      });

    });
  }

}

module.exports = bot;