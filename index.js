var config = require('./src/config.js'),
    Bot = require('./src/bot.js'),
    express = require('express'),
    app = express(),
    http = require('http');

var bot = new Bot(config);


app.get('/', function (req, res) {
  ping();
});


app.post('/', bot.onGroupMePost);


var port = Number(process.env.PORT || config.port);

app.listen(port, function () {
  console.log('App listening on port %s!',port);
});


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

