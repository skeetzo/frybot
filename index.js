// require('dotenv').load();
var http, director, bot, router, server, port;
http = require('http');
director = require('director');
bot = require('./bot.js');
var config = require('./config.js');

var scytalia = new bot();

router = new director.http.Router({
  '/' : {
    post: scytalia.respond,
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

port = Number(process.env.PORT || config.PORT);
server.listen(port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Hi, I'm "+config.NAME+" and I totally work.");
}

var CronJob = require('cron').CronJob;
var job = new CronJob({
 cronTime: '00 45 2 * * *',
  onTick: function() {
     scytalia.bottleReminder();
  },
  start: true,
  timeZone: 'America/Los_Angeles'
});
//job.start();
