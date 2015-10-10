var config = require('./config.js');

var http, director, bot, router, server, port;
http = require('http');
director = require('director');
bot = require('./bot.js');

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

server.listen(config.port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Hi, I'm "+config.name+" and I totally work.");
}

var CronJob = require('cron').CronJob;
var job = new CronJob({
 cronTime: '00 53 9 * * 6',
  onTick: function() {
     bot.bottleReminder();
     setTimeout(bot.readyChecker(),10000);
  },
  start: true,
  timeZone: 'America/Los_Angeles'
});
//job.start();
