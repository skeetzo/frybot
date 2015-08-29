var http, director, bot, router, server, port;
bot = require('./bot.js');
director = require('director');
http = require('http');
require('dotenv').load();

router = new director.http.Router({
  '/' : {
    post: bot.respond,
    get: ping
  }
});

server = http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });

  router.dispatch(req, res, function(err) {
    res.writeHead(err.status, {"Content-Type": "text/plain"});
    res.end(err.message);
  });
});

port = Number(process.env.PORT || 5000);
server.listen(port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Hi, I'm "+process.env.NAME+" and I totally work.");
}

var CronJob = require('cron').CronJob;
var job = new CronJob('00 10 15 * * 0-6', function() {
  bot.reminder();
  /*
   * Runs every weekday (Monday through Friday)
   * at 11:30:00 AM. It does not run on Saturday
   * or Sunday.
   */
  }, function () {
    /* This function is executed when the job stops */
  },
  true, /* Start the job right now */
  timeZone /* Time zone of this job. */
);
