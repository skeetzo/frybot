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

module.exports.getCurrentPlayers = function() {
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