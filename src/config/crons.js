
module.exports = function() {
	// CronJobs
	this.crons = {
		afterparty : {
			start : true,
			command : 'season',
			argument : 'afterparty',
			cronTime : '00 00 12 * 0-5 3',
	        timeZone: 'America/Los_Angeles'	
		},

		christmas : {
			start : false,
			cronTime : '00 00 09 25 11 *', 
	        timeZone: 'America/Los_Angeles'	
		},

		newseason : {
			start : false,
			command : 'season',
			argument : 'newseason',
			cronTime : '00 00 12 * 9-12 2', 
	        timeZone: 'America/Los_Angeles'	
		},

		nicofacts : {
			start : true,
			command : 'nicofacts',
			argument : 'spitNicoFact',
			cronTime : '00 30 19,21,23 * 0-5 2', 
	        timeZone: 'America/Los_Angeles'	
		},

		pregame : {
			start : true,
			command : 'season',
			argument : 'pregame',
			cronTime : '00 00 10 * 0-5 2', 
	        timeZone: 'America/Los_Angeles'	
		},

		tweetnicofact : {
			start : true,
			command : 'nicofacts',
			argument : 'tweetnicofact',
			cronTime : '00 00 19-24 * 0-5 2', 
	        timeZone: 'America/Los_Angeles'	
		}
	}
}