
// Load core as properties
//  ie: Bot.brain = require('./brain.js')
module.exports.load = function() {
	var self = this;
	self.logger.debug('Loading Core');
	require('fs').readdirSync(__dirname).forEach(function(file) {
	  if (file!='index.js') {
	  	self.logger.debug('attaching core: %s',file.replace('.js',''));
	    self[file.replace('.js', '')] = require('./' + file);
	  }
	});
}