var HTTPS = require('https');
var cool = require('cool-ascii-faces');
var tabletop = require('tabletop');


var botID = process.env.BOT_ID;

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botRegexIndex = ['/^\/cool guy$/','/^\/scores$/'],
      flag = false,
      key;
  for (i=0;i<botRegexIndex.length;i++) {
    flag = botRegexIndex[i].test(request.text);
    key = i;
  }
  if(request.text && flag) {
    this.res.writeHead(200);
    postMessage(key);
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
  
  switch (key) {
    case 0:
      botResponse = cool();
      break;
    case 1:
      botResponse = "There's nothing here yet.";
      break;      
  }
  
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
  callTable();
}

exports.respond = respond;
exports.testMessage = testMessage;
