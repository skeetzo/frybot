var bot = require('./lib/bot.js').bot;
var config = require('./lib/config.js');
var director = require('director');
var http = require('http');

var router = new director.http.Router({
  '/' : {
    post: bot.post,
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

var port = Number(process.env.PORT || config.port);
server.listen(port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Hi, I'm "+config.name+" and I totally work.");
  // bot.ping();
}

bot = new bot();
bot.boot();
