
// Load cmds as properties
//  ie: Bot.commands.bottle = require('./bottle.js')
module.exports.load = function() {
	var self = this;
	require('fs').readdirSync(__dirname).forEach(function(file) {
	  if (file!='index.js') {
	  	self.logger.debug('Adding command: %s',file.replace('.js',''));
	    self.commands[file.replace('.js', '')] = require('./' + file);
	  }
	});
}