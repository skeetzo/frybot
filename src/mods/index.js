
// Load mods as properties
//  ie: Bot.tweeter = require('./tweeter.js')
module.exports.load = function() {
	var self = this;
	self.logger.debug('Loading Mods');
	require('fs').readdirSync(__dirname).forEach(function(file) {
	  if (file!='index.js') {
	  	self.logger.debug('attaching mod: %s',file.replace('.js',''));
	    self[file.replace('.js', '')] = require('./' + file);
	  }
	});
}