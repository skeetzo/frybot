var HTTPS = require('https');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;

var regex = [
	"^\/cool guy$",
   "^\/scores$"
];
regex = new RegExp(regex.join("|"), "i");


function respond() {
  var request = JSON.parse(this.req.chunks[0]);

  if (request.text && request.text.match(regex)) {
    this.res.writeHead(200);
    postMessage(request.text);
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function postMessage(key) {
  var botResponse, options, body, botReq;

  botResponse = "Do it yourself.";
  if (key=='/cool guy')
    botResponse = cool();
  else if (key=='/scores')
    botResponse = "There's nothing here yet.";
  
  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

function testMessage(key) {
  var botResponse;

  botResponse = "Do it yourself.";
  
  switch (key) {
    case '\/cool':
      botResponse = cool();
      break;
    case '\/scores':
      botResponse = "There's nothing here yet.";
      break;      
  }

  console.log('sending ' + botResponse + ' to ' + botID);
}

exports.respond = respond;
exports.testMessage = testMessage;
