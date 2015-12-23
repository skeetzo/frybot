var bot = require('./bot.js');
bot = new bot();
var config = require('./config.js');
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

var port = Number(process.env.PORT || config.PORT);
server.listen(port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Hi, I'm "+config.NAME+" and I totally work.");
  // bot.ping();
}


