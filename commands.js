var Spreadsheet = require('edit-google-spreadsheet');
require("colors");

function availableCommands(command, argument, message) {
	if (!message)
		return 'empty message';
	if (!argument)
		return 'empty argument';
	if (!command)
		return 'empty command';
	





	return 'this totally works dude';
};

exports.commands = availableCommands;








