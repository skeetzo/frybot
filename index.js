var config = require('./src/config.js'),
    Bot = require('./src/bot.js'),
    director = require('director'),
    http = require('http');

var bot = new Bot(config);

var router = new director.http.Router({
  '/' : {
    post: bot.onGroupMePost.call(bot),
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
  this.res.end("Hi, I'm "+config.botName+" and I totally work right now.");
  // bot.ping();
}

// process.on('uncaughtException', function(err) {
//   console.log('Crashed: '+err);
// })

// Sleep Delay
setInterval(function() {
    http.get("http://"+config.botName+".herokuapp.com");
    console.log('*boing*');
}, 600000); // every 10 minutes

