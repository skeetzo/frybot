var _ = require('underscore'),
    CronJob = require('cron').CronJob;

// CronJobs
module.exports.start = function() {
  var self = this;
  var cronjobs = [];

  self.pregameJob = new CronJob({
    cronTime: self.config.pregameJobTime,
      onTick: function() {
        self.commands.activate.call(self,{command:'season',argument:'pregame'});
      },
      start: self.config.pregameJob,
      timeZone: 'America/Los_Angeles'
  });
  self.pregameJob.label = 'preGame';
  self.pregameJob.started = self.config.pregameJob;
  cronjobs.push(self.pregameJob);

  self.afterpartyJob = new CronJob({
    cronTime: self.config.afterpartyJobTime,
      onTick: function() {
        self.commands.activate.call(self,{command:'season',argument:'afterparty'});
      },
      start: self.config.afterpartyJob,
      timeZone: 'America/Los_Angeles'
  });
  self.afterpartyJob.label = 'After Party';
  self.afterpartyJob.started = self.config.afterpartyJob;
  cronjobs.push(self.afterpartyJob);

  self.newseasonJob = new CronJob({
    cronTime: self.config.newseasonJobTime,   // update to January 2nd, 2016
      onTick: function() {
        self.commands.activate.call(self,{command:'season',argument:'newseason'});
      },
      start: self.config.newseasonJob,
      timeZone: 'America/Los_Angeles'
  });
  self.newseasonJob.label = 'New Season';
  self.newseasonJob.started = self.config.newseasonJob;
  cronjobs.push(self.newseasonJob);

  /**
  * Called once per season to start the new season off
  *
  * started- maybe
  */
  // this will probably ulimately be an array of cronjobs set to go off on specific holidays
  self.christmasJob = new CronJob({
    cronTime: self.config.christmasJobTime,
      onTick: function() {
        // to-do; more of this
        self.say('Merry Christmas Bitches!');
        // to-do; update this date to a dynamic system
        self.say('Don\'t forget- Spring Session starts on 1/2');
        self.say('And also...');
      },
      start: self.config.christmasJob,
      timeZone: 'America/Los_Angeles'
  });
  self.christmasJob.label = 'Christmas';
  self.christmasJob.started = self.config.christmasJob;
  cronjobs.push(self.christmasJob);

  // Prints out the started cronjobs
  // job.start not available from outside reference? might change away from self. to just variables, they'd run anyways
  _.forEach(cronjobs, function(job) { if (job.started) self.logger.debug('started cronjob - '+job.label) });
}