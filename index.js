var bot = require('./bot.js');
bot = new bot();
var config = require('./config.js');
var director = require('director');
var http = require('http');

var router = new director.http.Router({
  '/' : {
    post: bot.respond,
    get: ping
  }
});

var server = http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });

  router.dispatch(req, res, function(err) {
    res.writeHead(err.status, {"Content-Type": "text/plain"});
    res.end(err.message);
  });
});

var port = Number(process.env.PORT || config.PORT);
server.listen(port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Hi, I'm "+config.NAME+" and I totally work.");
  // bot.ping();
}

var CronJob = require('cron').CronJob;
var job = new CronJob({
 cronTime: '00 58 9 * * 4',
  onTick: functiosn() {
     bot.bottle.duty();
  },
  start: true,
  timeZone: 'America/Los_Angeles'
});
