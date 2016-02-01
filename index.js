var bot = require('./lib/bot.js');
var config = require('./lib/config.js');
var director = require('director');
var http = require('http');

bot = new bot();

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

server.listen(config.port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Hi, I'm "+config.name+" and I totally work.");
  // bot.ping();
}

bot.boot();