var fs = require('fs'),
    mongo = require('mongoskin');

module.exports = function() {
	var self = this;

	this.logger = require('tracer').colorConsole(
	                {
	                    format : [
	                          "{{timestamp}} "+self.botName+": {{message}}",
	                          {
	                              error : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:({{method}}):{{line}})\nCall Stack:\n{{stack}}",
	                              debug : "{{timestamp}} {{message}} <{{title}}> (in {{file}}:({{method}}):{{line}})"
	                          }
	                    ],
	                    dateformat : "HH:MM:ss.L",
	                    preprocess :  function(data){
	                        data.title = data.title.toLowerCase();
	                    },
	                    transport : [
	                        function (data) {
	                            console.log(data.output);
	                        },
	                        function (data) {
	                            // Static
	                            if (process.env.NODE_ENV=='production') return;
	                            fs.appendFile(self.logger_log_path, data.output + '\n');
	                        },
	                        function (data) {
	                            // Stream
	                            if (process.env.NODE_ENV=='production') return;
	                            var stream = fs.createWriteStream(self.logger_stream_path, {
	                                flags: "a",
	                                encoding: "utf8",
	                                mode: 0666
	                            }).write(data.output+"\n");
	                        },
	                        function (data) {
	                            // Mongo
								if (process.env.NODE_ENV!='production') return;
								var db = mongo.db(this.MONGODB_URI),
									loginfo = db.collection("loginfo");
					            loginfo.insert( data, function(err, log) {
					                if (err) {
					                    console.error(err);
					                }
					            });
								   
	                        }
	                        ]
	                });
}