var config = require('./src/config/index.js'),
    bodyParser = require('body-parser'),
    Bot = require('./src/bot.js'),
    express = require('express'),
    app = express(),
    http = require('http');

var bot = new Bot(config);

process.on('uncaughtException', function(err) {
  bot.logger.error(err.stack);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.writeHead(200);
  res.end("Hi, I'm "+config.botName+" and I totally work right now.");
});

app.post('/', function (req, res) {
  bot.onGroupMePost.call(bot, req, res);
});

var port = Number(process.env.PORT || config.port);
app.listen(port, function () {
  console.log('App listening on port %s',port);
});

// Sleep Delay
// does this even work?
setInterval(function() {
    http.get("http://"+config.botName+".herokuapp.com");
    console.log('*boing*');
}, 600000); // every 10 minutes

