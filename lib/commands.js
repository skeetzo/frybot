var _ = require('underscore'),
    aws = require('aws-sdk'),
    config = require('./config.js'),
    fs = require('fs'),
    HTTPS = require('https'),
    League = require('./league.js').League,
    Spreadsheet = require('edit-google-spreadsheet');

var localTeamShitPath = './lib/teamshit.json',
    teamshitData = {};

aws.config.update({accessKeyId: config.AWS_ACCESS_KEY, secretAccessKey: config.AWS_SECRET_KEY});
var league,
    s3 = new aws.S3();

/*
  Commands Constructor
*/
var commands = function() {
  // var confirmedCommand;
}

/*
  Commands available, called via activate
*/
commands.prototype = {
  /**
  * Filter function activates the command process to be run
  * @param {Object} request - the request as passed from bot.post(), includes text and id
  * @param {function} callback - the method used to return any messages regarding success/failure
  */
  activate : function(request,callback) {
    // console.log('commands');
    var message = request.text || '';
    var sender = request.name;
    var matches = message.match(config.commandsRegex);
    console.log('matches1: '+matches);
    for (i=0;i<matches.length;i++) 
      if (matches[i]==""||matches[i]==="")
        matches.splice(i,1);
    var command;
    if (matches[0])
      command = matches[0].substring(1); // the first command match minus the slash
    else
      command = request.command || '';
    console.log('matches2: '+matches);
    var argument = matches[1]; // the first argument match
    if (argument!=undefined)
      message = message.substring(1+command.length+1+argument.length+1);
    else
      message = message.substring(1+command.length+1);
    if (request.argument)
      argument = request.argument;
    //                           // slash + space + space
    // var i = sender.indexOf(' ');
    // sender = sender.substring(0,i);
      // console.log('command: '+command+'['+argument+'] of '+sender+': \''+message+'\'');
    if (typeof this[command] === "function" ) {
      think_('Activating: '+command+'['+argument+'] of '+sender+': \''+message+'\'');
      this[command](argument, message, sender, callback);
      // likeMessage_(sender);
    }
    else
      callback(new Error('No command found'));
  },

  /*
    Loads the necessary league data
  */
  load : function(callback) {
    var self = this;
    think_('Loading Team Shit');
    var s3_params = {
      Bucket: config.S3_BUCKET,
      Key: config.AWS_SECRET_KEY,
    };
    if (!config.localLoad)
      s3.getObject(s3_params, function(err, data) {
        if (err) return callback(err);
        teamshitData = JSON.parse(data.Body.toString());
        // console.log('team shit: '+JSON.stringify(teamshitData));
        think_('Team Shit Loaded: s3');
        onLoad();
      });
    else 
      fs.readFile(localTeamShitPath, function read(err, data) {
        if (err) return callback(new Error('Local teamshit Not Found'));
        teamshitData = JSON.parse(data);
        think_('Team Shit Loaded: local');
        onLoad();
      });
    function onLoad() {
      self.bottleBitches = teamshitData.bottleBitches;
      league = new League(teamshitData.seasons, function(err) {
        if (err) return callback(err);
        callback(null);
        if (config.localLoad&&!config.localSave)
          self.saveTeamShitData();
      });
    }
  },

  /*
    Saves the team shit data
  */
  saveTeamShitData : function () {
    teamshitData.bottleBitches = this.bottleBitches || [],
    teamshitData.seasons = league.seasons;
    var s3_params = {
      Bucket: config.S3_BUCKET,
      Key: config.AWS_SECRET_KEY,
      ACL: 'public-read-write',
      Body: JSON.stringify(teamshitData),
      ContentType: 'application/json',
    };
    if (!config.localSave) {
      think_('Saving Team Shit to s3');
      s3.putObject(s3_params, function(err, data) {
        if (err) return think_(err);
        // console.log('data: '+JSON.stringify(teamshitData));
        think_('Team Shit (aws) Saved');
      });
    }
    else {
      think_('Saving Team Shit Locally');
      fs.writeFile(localTeamShitPath, JSON.stringify(teamshitData,null,4), function (err) {
        if (err) return think_(err);
        think_('Team Shit (local) Saved');
      });
    }
  },
  
  /**
  * Bottle command functions
  *  who, what
  *
  * Tells the group who/what is responsible for booze
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  * @param {function} callback - the function used to post messages
  */
  bottle : function(argument, message, sender, callback) {
    var self = this;
    // config.bottleBitches

    // load bitches
    // loads from config.bottleBitches if supplied, will overwrite existing
    if (!this.bottleBitches||this.bottleBitches.length<=0) {
      this.bottleBitches = teamshitData.bottleBitches || [];
      if (this.bottleBitches.length<=0) {
        think_('Populating Bottle Duty');
        var players = league.getCurrentSeason().players;
        if (!players||players.length<=0) {
          think_('Unable to update Bottle Duty: missing Players');
          return;
        }
        _.forEach(players, function addTobottleBitches(player) {
          self.bottleBitches.push(player.name);
        });
        this.bottleBitches = shuffle(this.bottleBitches);
        this.saveTeamShitData();
      }
      else {
        think_('Bottle Duty data found.');
        this.bottleBitches = teamshitData.bottleBitches;
      }
    }

    /*
      who's on duty
    */
    function duty() {
      callback(null,'Bottle Duty: '+self.bottleBitches[0]);
    }
    this.bottle.duty = duty;

    /*
      moves bottle duty forward
    */
    function next() {
      console.log('before: '+teamshitData.bottleBitches);
      var temp = this.bottleBitches.shift();
      this.bottleBitches.push(temp);
      teamshitData.bottleBitches = this.bottleBitches;
      console.log('after: '+teamshitData.bottleBitches);
      this.saveTeamShitData();
      think_('bottle duty updated');
    }
    this.bottle.next = next;

    /*
      randomly decides a liquor
    */
    function what() {
      var bottles = ['malibu bitchass rum','women\'s vodka','jaeger and redbull','jaeger and redbull','jaeger and redbull','jack and coke','jack and coke','jack and coke, bitch'];
      callback(null,'Pick up some: '+bottles[Math.random(0,bottles.length)]);
    }
    this.bottle.what = what;

    if (argument)
      this.bottle[argument]();
    else
      callback(null,'Wtf about a bottle?');
  },

  // Runs the cool guy thing
  coolguy : function(argument, message, sender, callback) {
    callback(null,cool());
  },

  /**
  * Scores command functions
  *   add, undo
  *
  * Adds Player scores to the It Is What It Is scoresheet
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  * @param {function} callback - the function used to post messages
  */
  scores : function(argument, message, sender, callback) {
    var self = this;
    /*
      adds scores
    */
    function add() {

      // Regex patterns used for parsing stat info
      //   only currently used in scores
      var statsRegex = new RegExp('([A-Za-z]+\\s*\\d{1}\\D*\\d{1})', "g"),
          nameRegex = '[A-Za-z]+',
          // scoreRegex = '\\d{1}\\D*\\d{1}$',
          pointsEarnedRegex = '\\d{1}',
          pointsGivenRegex = '\\d{1}$',
          dateDayRegex = '[\-]{1}([\\d]{2})[T]{1}',
          dateMonthRegex = '[\-]{1}([\\d]{2})[\-]{1}',
          dateYearRegex = '[\\d]{4}';

      Spreadsheet.load({
        debug: true,
        spreadsheetId: config.Google_ItIsWhatItIs_Spreadsheet_ID,
        worksheetId: config.ItIsWhatItIs_statsSheetID,
        oauth : config.Google_Oauth_Opts
      },
      function sheetReady(err, spreadsheet) {
        if(err) throw err;
        spreadsheet.receive(function(err, rows, info) {
          if(err) throw err;
          var matches = [],
              statResults = message.match(statsRegex);
          statResults.forEach(function (stat) {
            var match = '{"player":"","pointsEarned":"","pointsGiven":"","matchNumber":"","matchDate":""}';
            match = JSON.parse(match);
            // find name
            statsRegex = new RegExp(nameRegex);
            match.player = statsRegex.exec(stat);
            match.player = match.player[0];
            // find points earned
            statsRegex = new RegExp(pointsEarnedRegex);
            match.pointsEarned = statsRegex.exec(stat);
            match.pointsEarned = match.pointsEarned[0];
            // find points given
            statsRegex = new RegExp(pointsGivenRegex);
            match.pointsGiven = statsRegex.exec(stat);
            match.pointsGiven = match.pointsGiven[0];
            var timestamp = moment().format();
            var dateRegex = new RegExp(dateDayRegex);
            var day = dateRegex.exec(timestamp);
            day = day[1];
            dateRegex = new RegExp(dateMonthRegex);
            var month = dateRegex.exec(timestamp);
            month = month[1];
            dateRegex = new RegExp(dateYearRegex);
            var year = dateRegex.exec(timestamp);
            // last match number maintained automatically with overall last point of reference
            if (lastMatchNum_==5)
              lastMatchNum_ = 1;
            else
              lastMatchNum_++;
            match.matchNumber = lastMatchNum_;
            match.matchDate = month+'/'+day+'/'+year;
            var addedMatchJSONasString = '{ "1": "'+match.player+'", "2": "'+match.pointsEarned+'", "3":"'+match.pointsGiven+'", "4":"'+match.matchNumber+'", "5":"'+match.matchDate+'" }';                                    
            matches.push(addedMatchJSONasString);
          });
          // shifts each generated match into a row and added to the spreadsheet
          var endRow = info.lastRow+1+matches.length;
          for (i=info.lastRow+1;i<endRow;i++) {
            var jsonObj = "{\""+i+"\":"+matches.shift()+"}";
            jsonObj = JSON.parse(jsonObj);
            spreadsheet.add(jsonObj); // adds row one by one
          }
          spreadsheet.send(function(err) {
            if(err) think_(err);
              callback(null,'Scores added!');
          });
        });
      });
    }
    this.scores.add = add;

    /*
      calls out everybody's scores
    */
    function callouts() {
      think_('Callouts incoming');
      _.forEach(league.getCurrentSeason().getPlayers(),function (player) {
        scores.streak(player);
      });
    };
    this.scores.callouts = callouts;

    /*
      calls out the lowest valuable player
    */
    function lvp() {
      var leastValuablePlayer = 'Nico';
      _.forEach(league.getCurrentSeason().getPlayers(), function (player) {
        if (leastValuablePlayer=='Nico')
          leastValuablePlayer = player;
        else if (player.mvp<leastValuablePlayer.mvp)
          leastValuablePlayer = player;
      });
      callback(null,'Current LVP: '+leastValuablePlayer.toStats());
    }
    this.scores.lvp = lvp;

    /*
      calls out the most valuable player
    */
    function mvp() {
      var mostValuablePlayer = 'Oberg';
      _.forEach(league.getCurrentSeason().players, function (player) {
        if (mostValuablePlayer=='Oberg')
          mostValuablePlayer = player;
        else if (player.mvp>mostValuablePlayer.mvp)
          mostValuablePlayer = player;
      });
      callback(null,'Current MVP: '+mostValuablePlayer.toStats());
    }
    this.scores.mvp = mvp;

    /*
      returns the scores of the desired player
    */
    function of() {
      _.forEach(league.getCurrentSeason().players, function (player) {
        if (player.name===message)
          callback(null,'Stats: '+player.toStats());
      });
    }
    this.scores.of = of;

    /*
      Used in callouts to calculate win/loss streaks
    */
    function streak(player) {
      // forces player from string to obj
      if (typeof player != Object)
        _.forEach(league.getCurrentSeason().players, function (players) {
          if (typeof player != Object)
            if (players.name==player)
              player = players;
        });
      var matches = player.matches;
      var streak = '';
      var streakN = 0;
      for (i=0;i<matches.length;i++) {
        // to-do; could add in ways to track each individual hot streak
        if (matches[i][0]>matches[i][1]) {
          if (streak=='cold')
            streakN = 0;
          streak = 'hot';
          streakN++;
        }
        else {
          if (streak=='hot')
            streakN = 0;
          streak = 'cold';
          streakN++;
        }
      }
      var mod = '+';
      if (streak=='cold')
        mod = '-';
      if (streakN==1)
        streak = 'nothing special';
      else if (streakN==2) {
        if (streak=='cold')
          streak = 'chillin out';
        else
          streak = 'heating up';
      }
      else if (streakN==3) {
        if (streak=='cold')
          streak = 'ice cold';
        else
          streak = 'on fire';
      }
      else if (streakN>=5&&streakN<10) {
        if (streak=='cold')
          streak = 'falling asleep on the job';
        else
          streak = 'ablaze with glory';
      }
      else if (streakN>=10) {
        if (streak=='cold')
          streak = 'waking up in a dystopian future';
        else
          streak = 'selling their soul for victory';
      }
      else {
        if (streak=='cold')
          streak = 'dysfunctional';
        else
          streak = 'enh';
      }
      callback(null,player.name+' is '+streak+' with ('+mod+streakN+')');
    }
    // this.scores.streak = streak;

    /*
      Updates from the scores available on the team spreadsheet
    */
    function update() {
      think_('Updating Players from Scoresheet');
      Spreadsheet.load({
        debug: false,
        spreadsheetId: config.Google_ItIsWhatItIs_Spreadsheet_ID,
        worksheetId: config.ItIsWhatItIs_statsSheetID,
        oauth : config.Google_Oauth_Opts
      },
      function sheetReady(err, spreadsheet) {
        if (err) {
          think_(err);
          setTimeout(function() {
            think_('retrying sheet load');
            update();
          },5000);
          throw err;
        }
        spreadsheet.receive(function(err, rows, info) {
          if(err) throw err;
          // header pickoff
          // var once = true;
          var keys = '{"name":"","pointsEarned":"","pointsGiven":"","matchNumber":"","matchDate":""}';
          var matches = [];
          _.forEach(rows, function(row) {
              var match = JSON.parse(keys);
              match.name = row[1];
              match.pointsEarned = row[2];
              match.pointsGiven = row[3];
              match.matchNumber = row[4];
              lastMatchNum_ = row[4]; // laziness
              match.matchDate = row[5];
              // console.log('match: '+JSON.stringify(match));
              match.players = [
                match.name,
                'Player Two' // todo: update when recording opponent names
              ];
              // todo: update when recording opponents sl & game scores, default implied
              // match.race = '2:2';
              // match.games = [];
              matches.push(match);
          });
          var matchups = [];
          matches.shift(); // header blanks
          while (matches.length>0) {
            var matchup = [];
            var j=0;
            for (j;j<5&&j<matches.length;j++) 
              matchup.push(matches[j]);
            matches.splice(0,j);
            matchups.push(matchup);
          }
          league.getCurrentSeason().updateMatchups(matchups); // updates player data
          if (message!='quiet')
            callback(null,'Season scores updated');
          else
            think_('Scores updated');
          self.saveTeamShitData();
        });
      });
    }
    this.scores.update = update;

    if (argument)
      this.scores[argument]();
    else
      callback(null,'What about the scores '+sender+'?');
  },


  fuck : function(argument, message, sender, callback) {

    function you() {
      if (message==='frybot'||message==='Frybot') {
        callback(null,'Fuck you '+sender+'!');
        return;
      }
      callback(null,'Yeah fuck you '+message+'!');
    }
    this.fuck.off = you;

    function me() {
      if (!message||(message!='Frybot'&&message!='frybot'))
        callback(null,'I think I\'ll pass..');
      else
        callback(null,'Yeah fuck him '+message+'!');
    }
    this.fuck.off = me;

    function off() {
      if (message==='Frybot'||message==='frybot')
        callback(null,'No you fuck off '+sender+'!');
      else
        callback(null,'Yeah fuck off '+sender+'!');
    }
    this.fuck.off = off;

    if (argument)
      this.fuck[argument]();
    else
      callback(null,'Fuck off '+sender+'?');
  },

  /**
  * jk command functions
  *   butnotreally
  * 
  * Used to cancel the previously activated command within config.brainfart delay
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  // function jk(argument, message, sender) {
  //   jk.butnotreally = function() {
  //     callback(null,'trololjk');
  //   };
  //   if (argument)
  //     this.jk[argument]();
  //   else {
  //     callback(null,'jk');
  //     clearTimeout(confirmedCommand);
  //   }
  // };
  // this.jk = jk;


  // add method of reading chat for new nico facts on the fly
  nicofacts : function(argument, message, sender, callback) {
    var self = this;
    if (!this.nicofactsDB||this.nicofactsDB.length<=0) {
      think_('Loading Nico Facts');
      Spreadsheet.load({
        debug: true,
        spreadsheetId: config.Google_ItIsWhatItIs_Spreadsheet_ID,
        worksheetId: config.ItIsWhatItIs_nicofactsSheetID,
        oauth : config.Google_Oauth_Opts
      },
      function sheetReady(err, spreadsheet) {
        if(err) throw err;
        spreadsheet.receive(function(err, rows, info) {
          if(err) throw err;
          this.nicofactsDB = [];
          rows = _.toArray(rows);
          rows.shift();
          // console.log("rows: "+rows);
          _.forEach(rows, function(cols) {this.nicofactsDB.push('Nico Fact #'+cols[1]+': '+cols[2]);});
          think_('Nico Facts Loaded');
          self.nicofacts(argument, message, sender);
          callback(null,'Uhhh what?');
        });
      });
      return;
    }  
    if (sender.indexOf('Nico')>=0) {
      callback(null,'What do you think you\'re doing, bitchass Nico?');
      return;
    }

    var spitNicoFact = function() {
      callback(null,this.nicofactsDB[this.nicoFactCounter]);
      this.nicoFactCounter++;
      if (this.nicoFactCounter>this.nicofactsDB.length)
        this.nicoFactCounter=0;
    }

    function startNicoFacts() {
      this.nicofactsDB = shuffle(this.nicofactsDB);
      spitNicoFact();
      clearInterval(this.nicoFactTimer);
      this.nicoFactTimer = setInterval(spitNicoFact,120000); // 2 minutes
    }

    function FUCKOFF() {
      if (message!='PLEASE') {
        if (this.nicoFactCounter<10) {
          callback(null,'Invalid response. You have now been permanently subscribed to Nico Facts.');
          if (this.nicoFactPrimed) 
            startNicoFacts();
        }
        else
          callback(null,'Invalid response, motherfucker. Do you even Nico Fact?');
        return;
      }
      callback(null,'You have successfully unsubscribed from Nico Facts.');
      clearInterval(this.nicoFactTimer);
      this.nicoFactPrimed = false;
    }
    this.FUCKOFF = FUCKOFF;

    function YES() {
      if (this.nicoFactCounter<=0) {
        callback(null,'You have now been subscribed to Nico Facts.');
        startNicoFacts();
      }
      else
        callback(null,'You are all already subscribed to Nico Facts, bitchass '+sender+'...');
    }
    this.YES = YES;

    function NO() {
      callback(null,'Nico Fact #846: No one tells Nico Facts when to stop.');
    }
    this.NO = NO;

    function START() {
      callback(null,'Nico Fact #847: No one tells Nico Facts what to do.');
    }
    this.START = START;

    if (argument)
      this.nicofacts[argument]();
    else if (!argument&&!this.nicoFactPrimed) {
      this.nicoFactPrimed = true;
      this.nicoFactCounter = 0;
      callback(null,'Reply \'/nicofacts YES\' to subscribe to Nico Facts for a weekly charge of 1 Jäger Bomb. Standard msg and data rates will apply. You can cancel at anytime by replying \'/nicofacts FUCKOFF\'');
    }
    else {
      callback(null,'Invalid response.');
      this.nicofacts.YES();
    }
  },

  /**
  * Suck command functions
  *   my, his
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  suck : function(argument, message, sender, callback) {

    function my() {
      // if (sender!='Alex is Awesome'&&sender!='Schizo')
      //  return;
      if (sender=='Nico Mendoza'||sender=='Nico')
        callback(null,'yeah suck '+sender+'\'s tiny '+message+'!');
      else
        callback(null,'yeah suck '+sender+'\'s '+message+'!');
    }
    this.my = my;

    function his() {
      callback(null,'yeah suck his '+message+'! ');
      callback(null,'wait, what?');
    }
    this.his = his;

    if (argument)
      this.suck[argument]();
    else
      callback(null,'What about sucking '+sender+'\'s '+message+'?');
  },

  pregame : function(argument, message, sender, callback) {
    var maybes = ['It\'s League night bitch niggas!', 'Guess what day it is losers- wait, shut up meatbags I don\'t care cause its league night!'];
    callback(null,maybes[Math.floor(Math.random()*maybes.length)]);
    callback(null,'Playing @ '+league.getCurrentSeason().getTodaysMatchup().location);
    this.bottle('duty',null,null,callback);
    var players_ = league.getCurrentSeason().getPlayersByNames();
    callback(null,'I\'m betting... '+players_[Math.round(Math.random()*players_.length)]+' gets skunked tonight!');
  }
}


module.exports = commands;



function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function think_(what) {
  console.log(config.name+': '+what);
}