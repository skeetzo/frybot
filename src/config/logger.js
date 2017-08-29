var fs = require('fs'),
    colors = require('colors/safe'),
    mongo = require('mongoskin'),
    _ = require('underscore');

module.exports = function() {
	var self = this;
    self.db = mongo.db(this.MONGODB_URI); 

    // var logLevel = 'debug';
    // if (process.env.NODE_ENV==='production')
    	logLevel = 'log';

	self.logger = require('tracer').colorConsole(
        {	
        	methods : ['log','debug','warn','error','load','test'],
            format : [
                  colors.white("{{timestamp}} ")+colors.yellow(self.botName)+": {{message}}",
                  {
                      error : colors.white("{{timestamp}} ")+" <{{title}}> {{message}} (in {{file}}:({{method}}):{{line}})\nCall Stack:\n{{stack}}",
                      warn : colors.white("{{timestamp}} ")+" {{message}}",
                      debug : colors.white("{{timestamp}} ")+colors.yellow(self.botName)+": {{message}}",
                      test : colors.white("{{timestamp}} ")+colors.red(self.botName)+": "+colors.white("{{message}}")
                  }
            ],
            filters : {
	            //log : colors.black,
	            trace : colors.magenta,
	            debug : colors.blue,
	            info : colors.green,
	            warn : [ colors.yellow, colors.bold ],
	            error : [ colors.red, colors.bold ],
	            test : colors.yellow
	        },
	        level : logLevel,
            dateformat : "HH:MM:ss.L",
            preprocess :  function(data){
                data.title = data.title.toLowerCase();
            },
            transport : [
                function (data) {
                	// Console
                    console.log(data.output);
                },
                function (data) {
                    // Static
                    if (process.env.NODE_ENV==='production') return;
                    fs.appendFileSync(self.logger_log_path, data.output + '\n');
                },
                function (data) {
                    // Mongo
                	if (data.output.length==0) return;
					if (process.env.NODE_ENV!='production') return;
			        if (!self.logQueue) self.logQueue = [];
			        self.logQueue.push(data.output);
					if (!self.mongo_logging)
						(function mongoLog() {
							self.mongo_logging = true;
							var	loginfo = self.db.collection("loginfo");
							// self.db.bind('loginfo');
							loginfo.find().toArray(function(err, logs) {
								if (err) return queue(err.message);
								var message = self.logQueue.shift();
									// console.log('message: %s',message);
								if (logs.length===0)
									return loginfo.save({log:[message]}, function(err, log) {
						                if (err) return queue(err);
						                if (self.debugging_mongo) console.log('MONGODB: no logs found- making new');
						                queue();
						            });
								// set i = last log with < 100 entries
								var i = 0;
						        for (i;i<logs.length;i++)
						        	if (_.toArray(logs[i].log).length<666) 
						        		break;
						        // if a last log with < 100 entries wasn't found, make a new one
						        if (i==logs.length)
						        	return loginfo.insert({log:[message]}, function(err, log) {
						                if (err) return console.error(err);
						                if (self.debugging_mongo) console.log('MONGODB: full logs- making new');
						            	queue();
						            });
						        // update the found one
						        loginfo.updateById(logs[i]._id,{"$push":{log:message}},function(err) {
						        	if (err) return queue(err);
						        	if (self.debugging_mongo) console.log('MONGODB: log updated: %s',message);
						        	queue();
						        });
						        function queue(err) {
						        	if (err) console.log(err);
							        if (self.logQueue.length>0) mongoLog();
				                    else self.mongo_logging = false;
				                }
							});
						})();
                }
                ]
        });
>>>>>>> naivi
}