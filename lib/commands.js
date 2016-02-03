var config = require('./config.js');
var GroupMe_API = require('groupme').Stateless;
var Player = require('./league.js').Player;
var Spreadsheet = require('edit-google-spreadsheet');
var _ = require('underscore');
var fs = require('fs');
var aws = require('aws-sdk');
aws.config.update({accessKeyId: config.AWS_ACCESS_KEY, secretAccessKey: config.AWS_SECRET_KEY});
var s3 = new aws.S3();
var HTTPS = require('https');
var League = require('./league.js').League;

// var nicofactsDB = require('./nicofacts.js');

var localTeamShitPath = './lib/teamshit.json';
var teamshitData = {};

var self;
var thoughts_ = []; // the thoughts_ to be posted
var postman = function() {};
var league;

var commands = (function() {
  var confirmedCommand;
  self = this;
  league = new League();
  setTimeout(league.save, 10000);
  
  (function loadTeamShitData() {
    console.log('Loading Team Shit');
    var s3_params = {
      Bucket: config.S3_BUCKET,
      Key: config.AWS_SECRET_KEY,
    };
    if (!config.localLoad)
      s3.getObject(s3_params, function(err, data) {
        if (err) return console.log(err);
        teamshitData = JSON.parse(data.Body.toString());
        console.log('Team Shit Loaded: aws');
      });
    else 
      fs.readFile(localTeamShitPath, function read(err, data) {
        if (err) return console.log('Local teamshit Not Found');
        teamshitData = JSON.parse(data);
        console.log('Team Shit Loaded: local');
      });
  })();

  function saveTeamShitData() {
    var s3_params = {
      Bucket: config.S3_BUCKET,
      Key: config.AWS_SECRET_KEY,
      ACL: 'public-read-write',
      Body: JSON.stringify(teamshitData),
      ContentType: 'application/json'
    };
    if (!config.localSave)
      s3.putObject(s3_params, function(err, data) {
        if (err) return console.log(err);
        console.log('Team Shit (aws) Updated');
      });
    else 
      fs.writeFile(localTeamShitPath, JSON.stringify(teamshitData), function (err) {
        if (err) return console.log(err);
        console.log('Team Shit (local) Updated');
      });
  }

  /**
  * Bottle command functions
  *  who, what
  *
  * Tells the group who/what is responsible for booze
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  function bottle(argument, message, sender) {
    // config.bottleBitches

    // load bitches
    if (!config.bottleBitches||config.bottleBitches_.length<=0) {
      config.bottleBitches_ = teamshitData.bottleDuty || [];
      if (config.bottleBitches_.length<=0) {
        console.log('Populating Bottle Duty');
        if (!config.players_||config.players_.length<=0) {
          console.log('Unable to update Bottle Duty: missing Players');
          return;
        }
        _.forEach(config.players_, function addToBottleDuty(player) {
          config.bottleBitches_.push(player.name);
        });
        config.bottleBitches_ = shuffle(config.bottleBitches_);
        saveTeamShitData();
      }
      else
        console.log('Bottle Duty data found.');
    }

    bottle.duty = function () {
      say('Bottle Duty: '+config.bottleBitches_[0]);
    };

    bottle.next = function() {
      console.log('before: '+teamshitData.bottleDuty);
      var temp = config.bottleBitches_.shift();
      config.bottleBitches_.push(temp);
      teamshitData.bottleDuty = config.bottleBitches_;
      console.log('after: '+teamshitData.bottleDuty);
      saveTeamShitData();
    };

    bottle.what = function() {
      var bottles = ['rum','vodka','whiskey','jaeger and redbull','jack and coke','jack and coke','jack and coke, bitch'];
      say('Pick up some: '+bottles[Math.random(0,bottles.length)]);
    };
    if (argument)
      bottle[argument]();
    else
      say('Wtf about a bottle?');
  };
  this.bottle = bottle;

  // Runs the cool guy thing
  function coolguy() {
    say(cool());
  };
  this.coolguy = coolguy;


  // Regexes used for parsing stat info
  //   only currently used in scores
  var statsRegex = '([A-Za-z]+\\s*\\d{1}\\D*\\d{1})';
  var nameRegex = '[A-Za-z]+';
  var scoreRegex = '\\d{1}\\D*\\d{1}$';
  var pointsEarnedRegex = '\\d{1}';
  var pointsGivenRegex = '\\d{1}$';
  var dateRegex;
  var dateDayRegex = '[\-]{1}([\\d]{2})[T]{1}';
  var dateMonthRegex = '[\-]{1}([\\d]{2})[\-]{1}';
  var dateYearRegex = '[\\d]{4}';
  statsRegex = new RegExp(statsRegex, "g");
  /**
  * Scores command functions
  *   add, undo
  *
  * Adds Player scores to the It Is What It Is scoresheet
  *
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  function scores(argument, message, sender) {
    scores.add = function() {
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
        if(err) throw err;
        spreadsheet.receive(function(err, rows, info) {
          if(err) throw err;
          var matches = [];
          var statResults = message.match(statsRegex);
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
            dateRegex = new RegExp(dateDayRegex);
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
            // arrays and Player info updated accordingly
            for (i=0;i<league.getCurrentSeason().getPlayers().length;i++) {
              if (league.getCurrentSeason().getPlayers()[i].name==match.player)
                league.getCurrentSeason().getPlayers()[i].addMatchStats(match.pointsEarned, match.pointsGiven, match.matchNumber, match.matchDate);
            }
            var addedMatchJSONasString = '{ "1": "'+match.player+'", "2": "'+match.pointsEarned+'", "3":"'+match.pointsGiven+'", "4":"'+match.matchNumber+'", "5":"'+match.matchDate+'" }';                                    
            matches.push(addedMatchJSONasString);
            config.all_matches_.push(match);
          });
          // shifts each generated match into a row and added to the spreadsheet
          var endRow = info.lastRow+1+matches.length;
          for (i=info.lastRow+1;i<endRow;i++) {
            var jsonObj = "{\""+i+"\":"+matches.shift()+"}";
            jsonObj = JSON.parse(jsonObj);
            spreadsheet.add(jsonObj); // adds row one by one
          }
          spreadsheet.send(function(err) {
            if(err) console.log(err);
              say('Scores added!');
          });
        });
      });
    };
    scores.callouts = function() {
      console.log('Callouts incoming');
      _.forEach(league.getCurrentSeason().getPlayers(),function (player) {
        scores.streak(player);
      });
    };
    scores.lvp = function() {
      var leastValuablePlayer = 'Nico';
      _.forEach(league.getCurrentSeason().getPlayers(), function (player) {
        if (leastValuablePlayer=='Nico')
          leastValuablePlayer = player;
        else if (player.mvp<leastValuablePlayer.mvp)
          leastValuablePlayer = player;
      });
      say('Current LVP: '+leastValuablePlayer.toStats());
    };
    scores.mvp = function() {
      var mostValuablePlayer = 'Oberg';
      _.forEach(league.getCurrentSeason().getPlayers(), function (player) {
        if (mostValuablePlayer=='Oberg')
          mostValuablePlayer = player;
        else if (player.mvp>mostValuablePlayer.mvp)
          mostValuablePlayer = player;
      });
      say('Current MVP: '+mostValuablePlayer.toStats());
    };
    scores.of = function() {
      _.forEach(league.getCurrentSeason().getPlayers(), function (player) {
      if (player.name===message)
        say('Stats: '+player.toStats());
    });
    };
    scores.streak = function (player) {
      // forces player from string to obj
      if (typeof player != Object)
        _.forEach(league.getCurrentSeason().getPlayers(), function (players) {
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
      say(player.name+' is '+streak+' with ('+mod+streakN+')');
    };
    scores.update = function() {
      console.log('Updating Players from Scoresheet');
      var all_players_temp = [];
      var all_matches_temp = [];
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
                all_matches_temp.push(match);
                // Adds the Player if new, updates scores afterwards
                if (all_players_temp.length==0) {
                  // console.log('Adding the first player: '+match.player);
                  var newPlayer = new Player({"name":match.player})
                  newPlayer.addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                  all_players_temp.push(newPlayer);
                }
                else {
                  var found = false;
                  for (j=0;j<all_players_temp.length;j++) 
                    if (all_players_temp[j].name==match.player) {
                      // console.log('Found player: '+match.player);
                      found = true;
                      all_players_temp[j].addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                    }
                  if (!found) {
                    // console.log('Adding new player: '+match.player);
                    var newPlayer = new Player({"name":match.player})
                    newPlayer.addMatchStats(match.pointsEarned,match.pointsGiven,match.matchDate,match.matchNumber);
                    all_players_temp.push(newPlayer);
                  }
                }
                league.getCurrentSeason().setPlayers(all_players_temp);

                // config.players_ = all_players_temp;
                // config.all_matches_ = all_matches_temp;
              }
          });
          if (message!='quiet')
            say('Season scores updated');
          else
            console.log('Scores updated');
        });
      });
      
    };
    scores.undo = function() {

    };
    if (argument)
      self.scores[argument]();
    else
      say('What about the scores '+sender+'?');
  };
  this.scores = scores;

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
  function jk(argument, message, sender) {
    jk.butnotreally = function() {
      say('trololjk');
    };
    if (argument)
      this.jk[argument]();
    else {
      say('jk');
      clearTimeout(confirmedCommand);
    }
  };
  this.jk = jk;


  // add method of reading chat for new nico facts on the fly
  var nicoFactTimer,
      nicoFactCounter = 0,
      nicoFactPrimed = false;
      // nicofactsDB
  function nicofacts(argument, message, sender) {
    if (!config.nicofactsDB||config.nicofactsDB.length<=0) {
      console.log('Loading Nico Facts');
      Spreadsheet.load({
        debug: true,
        spreadsheetId: config.ItIsWhatItIs_Spreadsheet_ID,
        worksheetId: config.ItIsWhatItIs_nicofactsSheetID,
        oauth : {
          email: config.Frybot_Google_ServiceEmail,
          key: config.Frybot_Google_key
        }
      },
      function sheetReady(err, spreadsheet) {
        if(err) throw err;
        spreadsheet.receive(function(err, rows, info) {
          if(err) throw err;
          config.nicofactsDB = [];
          rows = _.toArray(rows);
          rows.shift();
          // console.log("rows: "+rows);
          _.forEach(rows, function(cols) {config.nicofactsDB.push('Nico Fact #'+cols[1]+': '+cols[2]);});
          console.log('Nico Facts Loaded');
          nicofacts(argument, message, sender);
        });
      });
      return;
    }  
    if (sender==='Nico Mendoza') {
      say('What do you think you\'re doing, bitchass Nico?');
      return;
    }

    var spitNicoFact = function() {
      say(config.nicofactsDB[nicoFactCounter]);
      nicoFactCounter++;
      if (nicoFactCounter>config.nicofactsDB.length)
        nicoFactCounter=0;
    };

    function startNicoFacts() {
      config.nicofactsDB = shuffle(config.nicofactsDB);
      spitNicoFact();
      clearInterval(nicoFactTimer);
      nicoFactTimer = setInterval(spitNicoFact,120000); // 2 minutes
    };

    nicofacts.FUCKOFF = function() {
      if (message!='PLEASE') {
        if (nicoFactCounter<10) {
          say('Invalid response. You have now been permanently subscribed to Nico Facts.');
          if (nicoFactPrimed) 
            startNicoFacts();
        }
        else
          say('Invalid response, motherfucker. Do you even Nico Fact?');
        return;
      }
      say('You have successfully unsubscribed from Nico Facts.');
      clearInterval(nicoFactTimer);
      nicoFactPrimed = false;
    };

    nicofacts.YES = function() {
      if (nicoFactCounter<=0) {
        say('You have now been subscribed to Nico Facts.');
        startNicoFacts();
      }
      else
        say('You are all already subscribed to Nico Facts, bitchass '+sender+'...');
    };
    nicofacts.NO = function() {
      say('Nico Fact #846: No one tells Nico Facts when to stop.');
    }

    nicofacts.START = function() {
      say('Nico Fact #847: No one tells Nico Facts what to do.');
    }

    if (argument)
      this.nicofacts[argument]();
    else if (!argument&&!nicoFactPrimed) {
      nicoFactPrimed = true;
      nicoFactCounter = 0;
      say('Reply \'/nicofacts YES\' to subscribe to Nico Facts for a weekly charge of 1 Jäger Bomb. Standard msg and data rates will apply. You can cancel at anytime by replying \'/nicofacts FUCKOFF\'');
    }
    else {
      say('Invalid response.');
      this.nicofacts.YES();

    }
  };
  this.nicofacts = nicofacts;

  /**
  * Suck command functions
  *   my, his
  * @param {string} argument - The argument to call
  * @param {string} message - The message it's from
  * @param {string} sender - The sender it's from
  */
  function suck(argument, message, sender) {
    suck.my = function() {
      // if (sender!='Alex is Awesome'&&sender!='Schizo')
      //  return;
      if (sender=='Nico Mendoza'||sender=='Nico')
        say('yeah suck '+sender+'\'s tiny '+message+'!');
      else
        say('yeah suck '+sender+'\'s '+message+'!');
    };
    suck.his = function() {
      say('yeah suck his '+message+'! ');
      say('wait, what?');
    };
    if (argument)
      suck[argument]();
    else
      say('What about sucking '+sender+'\'s '+message+'?');
  };
  this.suck = suck;





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
  postman = function() {
      postMaster_();
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
    console.log(('sending \'' + message + '\' to [' + config.GroupMe_group_name).green+']');
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

  function say(thought) {
  thoughts_.push(thought);
  clearTimeout(postman);
  setTimeout(postman, config.responseTime);
};








})();

// module.exports = commands.activate;
/**
* Filter function activates the command process to be run
* @param {Object} request - the request as passed from bot.post(), includes text and id
*/
exports.activate = function(request) {
  // console.log('request: '+request);
  var message = request.text || '';
  var sender = request.name;
  var matches = message.match(config.commandsRegex);
  for (i=0;i<matches.length;i++) 
    if (matches[i]==""||matches[i]==="")
      matches.splice(i,1);
  var command = matches[0].substring(1); // the first command match minus the slash
  var argument = matches[1]; // the first argument match
  if (argument!=undefined)
    message = message.substring(1+command.length+1+argument.length+1);
  else
    message = message.substring(1+command.length+1);
  //                           // slash + space + space
  // var i = sender.indexOf(' ');
  // sender = sender.substring(0,i);
  if (typeof self[command] === "function" ) {
    console.log('Activating: '+command+'['+argument+'] of '+sender+': \''+message+'\'');
    self[command](argument, message, sender);
    likeMessage_(sender);
  }
};



  /**
  * Likes the message with the given id
  * @param {string} message_id - The message's id
  */
  function likeMessage_(message_id) {GroupMe_API.Likes.create(config.GroupMe_AccessToken, config.GroupMe_group_ID, message_id, function(err,ret) {});};


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