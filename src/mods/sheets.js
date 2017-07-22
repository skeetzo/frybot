var config = require('../config/index.js'),
    logger = config.logger,
    _ = require('underscore'),
    async = require('async'),
    GoogleSpreadsheet = require('google-spreadsheet');

module.exports.loadSchedule = function(callback) {
  logger.log('Loading Schedule');
  var doc = new GoogleSpreadsheet(config.Google_ItIsWhatItIs_Spreadsheet_ID),
      sheet;
  async.series([
    function setAuth(step) {
      doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
    },
    function getInfoAndWorksheets(step) {
      doc.getInfo(function(err, info) {
        logger.debug('Loaded sheet: '+info.title);
        for (var i=0;i<info.worksheets.length;i++)
          if (info.worksheets[i].title=='references') 
            sheet = info.worksheets[i];
        step();
      });
    },
    function workingWithRows(step) {
      sheet.getRows({
        // offset: 0,
        // limit: 20,
        orderby: 'col1'
      }, function( err, rows ){
        if (err) return callback(err);
        // self.logger.debug('Rows: %s',JSON.stringify(rows,null,4));
        rows = _.toArray(rows);
        rows.shift();
        var weeks = [];
        // Reads 'references' sheet for existing Players and Matchup Schedule
        _.forEach(rows, function(cols) {
          if (cols[3])
            weeks.push(
              {
                date: cols[4],
                teamOne: config.homeTeam,
                teamTwo: cols[5],
                location: cols[7]
              }
            );
        });
        logger.log('Schedule: %s',weeks);
        logger.log('Schedule Loaded');
        callback(null,weeks);
      });
    }
  ]);
}

module.exports.addScores = function(scores,callback) {
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
  async.series([
    function setAuth(step) {
      doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
    },
    function getInfoAndWorksheets(step) {
      doc.getInfo(function(err, info) {
        logger.debug('Loaded sheet: '+info.title);
        for (var i=0;i<info.worksheets.length;i++)
          if (info.worksheets[i].title=='Current Season Stats') 
            sheet = info.worksheets[i];
        step();
      });
    },
    function workingWithRows(step) {
      sheet.getRows({
        // offset: 0,
        // limit: 20,
        orderby: 'col1'
      }, function( err, rows ){
        if (err) return callback(err);
        statResults = scores.match(statsRegex);
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
        var endRow = sheet.rowCount+1+matches.length;
        for (i=sheet.rowCount+1;i<endRow;i++) {
          var jsonObj = "{\""+i+"\":"+matches.shift()+"}";
          jsonObj = JSON.parse(jsonObj);
          sheet.addRow(jsonObj); // adds row one by one
        }
        callback(null);
      });
    }
  ]);
}

module.exports.updateScores = function(callback) {
  logger.log('Loading Players from Scoresheet');
  var doc = new GoogleSpreadsheet(config.Google_ItIsWhatItIs_Spreadsheet_ID),
      sheet;
  async.series([
    function setAuth(step) {
      doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
    },
    function getInfoAndWorksheets(step) {
      doc.getInfo(function(err, info) {
        logger.debug('Loaded sheet: '+info.title);
        for (var i=0;i<info.worksheets.length;i++)
          if (info.worksheets[i].title=='Current Season Stats') 
            sheet = info.worksheets[i];
        step();
      });
    },
    function workingWithRows(step) {
      sheet.getRows({
        // offset: 0,
        // limit: 20,
        orderby: 'col1'
      }, function( err, rows ){
        if (err) return callback(err);
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
            logger.debug('match: '+JSON.stringify(match));
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
        callback(null,matchups);
      });
    }
  ]);
}



module.exports.addNicoFact = function(nicoFact,callback) {
  logger.log('Updating Players from Scoresheet');

  var doc = new GoogleSpreadsheet(config.Google_ItIsWhatItIs_Spreadsheet_ID),
      sheet;
  async.series([
    function setAuth(step) {
      doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
    },
    function getInfoAndWorksheets(step) {
      doc.getInfo(function(err, info) {
        logger.debug('Loaded sheet: '+info.title);
        for (var i=0;i<info.worksheets.length;i++)
          if (info.worksheets[i].title=='Current Season Stats') 
            sheet = info.worksheets[i];
        step();
      });
    },
    function workingWithRows(step) {
      sheet.getRows({
        // offset: 0,
        // limit: 20,
        orderby: 'col1'
      }, function( err, rows ){
        if (err) return callback(err);
        rows = _.toArray(rows);
        var reggie = new RegExp('\"','g');
        nicoFact.fact = nicoFact.fact.replace(reggie,'\\\"');
        var jsonObj = "{\""+(sheet.rowCount+1)+"\": {\"1\": \""+nicoFact.number+"\",\"2\": \""+nicoFact.fact+"\"}}";
        try {
          jsonObj = JSON.parse(jsonObj);
        }
        catch(e) {
          if (e) logger.warn(e);
          jsonObj = "{\""+(sheet.rowCount+1)+"\": {\"1\": \"-666\",\"2\": \"faulty json bro\"}}";
        }
        sheet.addRow(jsonObj);
        callback(null);
      });
    }
  ]);
}


module.exports.getCurrentPlayers = function(callback) {
  logger.log('Loading Players');
  var doc = new GoogleSpreadsheet(config.Google_ItIsWhatItIs_Spreadsheet_ID),
      sheet;
  async.series([
    function setAuth(step) {
      doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
    },
    function getInfoAndWorksheets(step) {
      doc.getInfo(function(err, info) {
        logger.debug('Loaded sheet: '+info.title);
        for (var i=0;i<info.worksheets.length;i++)
          if (info.worksheets[i].title=='references') 
            sheet = info.worksheets[i];
        step();
      });
    },
    function workingWithRows(step) {
      sheet.getRows({
        // offset: 0,
        // limit: 20,
        orderby: 'col1'
      }, function( err, rows ){
        if (err) return callback(err);
        // self.logger.debug('Rows: %s',JSON.stringify(rows,null,4));
        rows = _.toArray(rows);
        rows.shift();
        var playersAndSLs = [];
        // Reads 'references' sheet for existing Players and Matchup Schedule
        _.forEach(rows, function(cols) {
          if (cols[1])
            playersAndSLs.push(new Player({name: cols[1],SL: cols[2]}));
        });
        logger.log('Players: %s',playersAndSLs);
        logger.log('Players Loaded');
        callback(null,playersAndSLs);
      });
    }
  ]);
}