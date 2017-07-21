var _ = require('underscore'),
    config = require('../config/index'),
    logger = config.logger,
    CronJob = require('cron').CronJob;

// CronJobs
module.exports.start = function() {
  var self = this;
  var crons = [];

  function makePretty(functionName) {
      return functionName.charAt(0).toUpperCase()+functionName.substring(1).replace(/[A-Z]/g, function(letter, index) {
          return ' '+letter;
      });
  }

  var keys = _.keys(config.crons);

  _.forEach(keys,function(key) {
      var cro = config.crons[key];
      var cron = new CronJob({
          cronTime: cro.cronTime,
          onTick: function() {if (self.commands[cro.command] && typeof self.commands[cro.command] == 'function') self.commands[cro.command].call(self,cro)},
          start: cro.start,
          timeZone: cro.timeZone
      });
      cron.label = makePretty(key);
      cron.started = cro.start;
      crons.push(cron);
  });

  // Prints out the started cronjobs
  _.forEach(crons, function(job) {
      if (job.started) logger.log('started cronjob - %s',job.label);
  });
}