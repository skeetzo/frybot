var colors = require("colors"),
    _ = require('underscore'),
    commands = require('./commands.js'),
    CronJobs = require('./cronjobs.js'),
    HTTPS = require('https'),
    util = require('util'),
    fs = require('fs'),
    logger = require('tracer').colorConsole(
                {
                  filters : {
                    // log : colors.black,
                    trace : colors.magenta,
                    debug : colors.blue,
                    info : colors.green,
                    warn : colors.yellow,
                    error : [ colors.red, colors.bold ]
                  },
                  format : [
                        "{{timestamp}} <{{title}}> {{message}} (in {{file}}:({{method}}):{{line}})", //default format
                        {
                            error : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:({{method}}):{{line}})\nCall Stack:\n{{stack}}" // error format
                        }
                  ],
                  dateformat : "HH:MM:ss.L",
                  preprocess : function(data) {
                      data.title = data.title.toUpperCase();
                  },
                  transport : [
                      function (data) {
                          console.log(data.output);
                      },
                      function (data) {
                          if (process.NODE_ENV == 'production') return;        
                          fs.appendFile('./dev/file.log', data.output + '\n');
                      },
                      function (data) {
                          if (process.NODE_ENV != 'production') return;        
                          var stream = fs.createWriteStream("./dev/stream.log", {
                              flags: "a",
                              encoding: "utf8",
                              mode: 0666
                          }).write(data.output+"\n");
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
  this.commands = commands;
  this.commands.updateAWS.call(this);
  this.boot.call(this);

}

bot.prototype = {

  activate : function(request, callback) {
    // console.log('commands');
    var command = request.command || '',
        argument = request.argument || '',
        message = request.text || '',
        sender = request.name || '';
        request.message = message;
    // console.log('command: '+command+'['+argument+'] of '+sender+': \''+message+'\'');
    if (typeof commands[command] === "function" ) {
      this.logger.log('Activating: %s[%s] of %s: \'%s\'',command.blue,argument.red,sender.yellow,message);
      if (request.id) likeMessage_(request.id);
      this.commands[command].call(this,argument,message,sender);
    }
    else
      callback(new Error('No command found'));
  },

  /*
    Boots up the bot after loading all data necessary for commands
      commands loads League data
  */
  boot : function() {
    var self = this;
    self.logger.log('Booting up: '+self.config.botName);
    commands.load.call(self,function onLoad(err) {
      if (err) return self.logger.error(err);
      // loads current league data then syncs with ItIsWhatItIs sheet stats
      self.logger.debug('League Loaded');
      // Initial scores update on boot
      self.commands.loadModules.call(self);
      self.activate.call(self,{command: "scores",argument:"boot",name:self.config.botName});
      if (self.config.cronjobbing) CronJobs.start.call(self);
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
    if (request.name===self.config.botName) return logger.debug('Not talking to myself...');
    logger.log(request.name.yellow+": "+request.text);
    if (request.text.search(self.config.commandsRegex)!=-1) {
      var message = request.text || '',
          command = message.match(self.config.commandsRegex)[0],
          argument = message.match(self.config.argumentsRegex)[0];
      command = command.substring(1); // the first command match minus the slash
      if (argument!=undefined)
        message = message.substring(1+command.length+1+argument.length+1);
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
    self.logger.log('Sending: \'%s\' to [%s]',message.green,self.config.GroupMe_group_name);
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

process.on('uncaughtException', function(err) {
  logger.error(err.stack);
});