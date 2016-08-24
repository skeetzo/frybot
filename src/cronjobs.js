// CronJobs
module.exports.start = function() {
  var self = this;
  var cronjobs = [];
  /**
  * Called weekly on Tuesday at 6:00 PM before 7:30 PM league match
  *  by index.js  
  *  
  * started- yes
  */
  self.pregameJob = new CronJob({
    cronTime: config.pregameJobTime,
      onTick: function() {
        self.commands.activate({command:'pregame'},function(err, message) {
          if (err) return think_(err);
          self.say(message);
        });
      },
      start: config.pregameJob,
      timeZone: 'America/Los_Angeles'
  });
  self.pregameJob.label = 'Pregame';
  self.pregameJob.started = config.pregameJob;
  cronjobs.push(self.pregameJob);

  /**
  * Called weekly on Wednesday at 12:00 PM
  *
  * started- yes
  */
  self.afterpartyJob = new CronJob({
    cronTime: config.afterpartyJobTime,
      onTick: function() {
        // messages about the nights game
        // did we win or lose
        // who did the best for the night
        // who did the worst for the night
        // commands.activate({command:'afterParty'});
        var update = {
          text: "quiet",
          command: "scores",
          argument: "update",
          name: config.name
        };
        self.commands.activate(update,function(err, message) {
          if (err) return think_(err);
          self.say(message);
        });
        self.commands.activate({command:'bottle',argument:'next'},function(err, message) {
          if (err) return think_(err);
          self.say(message);
        });
        // scores of all the other people who played
      },
      start: config.afterpartyJob,
      timeZone: 'America/Los_Angeles'
  });
  self.afterpartyJob.label = 'After Party';
  self.afterpartyJob.started = config.afterpartyJob;
  cronjobs.push(self.afterpartyJob);

  /**
  * Called once per season to start the new season off
  *     auto start for x weeks after end of previous season
        end of previous season determined by # of weeks?
  * started- maybe
  */
  self.newSeasonJob = new CronJob({
    cronTime: config.newSeasonJobTime,   // update to January 2nd, 2016
      onTick: function() {
        // to-do; all of this
        // messages about a hopeful new season
        // did we win last season
        // are we going to win this season
        // who is we, introduce all the players
        // create introduce() and timeoutdelay for each player
      },
      start: config.newSeasonJob,
      timeZone: 'America/Los_Angeles'
  });
  self.newSeasonJob.label = 'New Season';
  self.newSeasonJob.started = config.newSeasonJob;
  cronjobs.push(self.newSeasonJob);

  /**
  * Called once per season to start the new season off
  *
  * started- maybe
  */
  // this will probably ulimately be an array of cronjobs set to go off on specific holidays
  self.christmasJob = new CronJob({
    cronTime: config.christmasJobTime,
      onTick: function() {
        // to-do; more of this
        self.say('Merry Christmas Bitches!');
        // to-do; update this date to a dynamic system
        self.say('Don\'t forget- Spring Session starts on 1/2');
        self.say('And also...');
      },
      start: config.christmasJob,
      timeZone: 'America/Los_Angeles'
  });
  self.christmasJob.label = 'Christmas';
  self.christmasJob.started = config.christmasJob;
  cronjobs.push(self.christmasJob);

  // Prints out the started cronjobs
  // job.start not available from outside reference? might change away from self. to just variables, they'd run anyways
  _.forEach(cronjobs, function(job) {
    if (job.started)
      think_('started cronjob - '+job.label);
  });
}