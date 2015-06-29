var http, director, cool, bot, router, server, port;

http        = require('http');
director    = require('director');
cool        = require('cool-ascii-faces');
bot         = require('./bot.js');

var request;

var scytalia = new bot.scytalia();
function respond() {
  this.res.writeHead(200);
  scytalia.respond;
  this.res.end("Hi, I am scytalia."+this.req);
};

router = new director.http.Router({
  '/' : {
    post: respond,
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
//  var that = JSON.stringify(request);
  this.res.end("Hi, I'm scytalia. And I totally work."+this.req);
}
