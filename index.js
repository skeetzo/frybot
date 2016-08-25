var config = require('./src/config.js'),
    bodyParser = require('body-parser'),
    Bot = require('./src/bot.js'),
    express = require('express'),
    app = express(),
    http = require('http');

var bot = new Bot(config);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use(function (req, res) {
//   console.log("Received a chat message:")
//   console.log(req.body)
//   bot.onGroupMePost.call(bot, req, res);
//   // if (req.body.name != BOT_NAME) 
// });

app.get('/', function (req, res) {
  ping.call(this);
});

app.post('/', function (req, res) {
  // res.send('Hello World!');
  console.log('stuff is about to happen yo');
  console.log(req);
  bot.onGroupMePost.call(bot, req, res);

});


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

