var http, director, bot, router, server, port;
bot         = require('./bot.js');
director    = require('director');
http        = require('http');
require('dotenv').load();
require("colors");

var scytalia = new bot.scytalia();


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

port = Number(process.env.PORT || 5000);
server.listen(port);

function ping() {
  this.res.writeHead(200);
 // scytalia.respond();
  this.res.end("Hi, I'm scytalia. And I totally work.");
}
