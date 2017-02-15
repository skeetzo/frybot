var _ = require('underscore'),
 	Twit = require('twit');

const TWO_MINUTES = 120000,
	  FIVE_MINUTES = 300000,
	  TEN_MINUTES = 600000,
	  UPDATE_CACHE_TIMEOUT = TEN_MINUTES,
      FRIENDS_CACHE_RESET = TEN_MINUTES,
  	  ONLY_FOLLOWERS_CACHE_RESET = TEN_MINUTES,
	  FOLLOWERS_CACHE_RESET = TEN_MINUTES,
	  FOLLOW_DELAY = TEN_MINUTES;

module.exports = {

	/*
		Boots Twitter Mod
			actions & their crons
			connect
	*/
	boot : function(callback) {
		var self = this;
		self.logger.log('Booting Twitter Mod...');
		self.twitter.actions.call(self);
		self.twitter.crons.call(self);
		self.twitter.connect.call(self,callback);
	},

	/*
		connects to Twitter's processes
	*/
	connect : function(callback) {
		var self = this;
		self.logger.log('Connecting to Twitter...');
		if (!self.config.Twitter_On) return self.logger.warn('Twitter Disabled');
		self.twitter.T = new Twit(self.config.TwitterConfig);
		self.twitter.T.get('account/verify_credentials',{},function (err, user) { 
            if (err) return callback(err);
            self.logger.log('Connected to Twitter: %s',user.name);
            // self.logger.debug(JSON.stringify(user));
            self.Twitter_user = user;
            callback(null);
		});
	},

	/*
		add each to self.config.crons
	*/
	crons : function() {
		this.logger.debug('Adding Twitter crons');
		// follow random friend of friend that passes industry regex
		this.config.crons.mingle = {
			start : true,
			cronTime : '00 0-60/3 12 * * *', // every 3 minutes from 12-1
	        timeZone: 'America/Los_Angeles'	
		};
	},


	/*
        Tweet if config.tweeting
            adds to tweetQueue if 10 tweets tweeted recently
    */
    tweet : function(status) {
        var self = this;
    	if (!status||status.length===0) return self.logger.warn('-- Ignoring Empty Tweet --');
        if (!self.twitter.tweetQueue) self.twitter.tweetQueue = [];
        if (!self.recent_tweets) self.recent_tweets = [];
        if (_.contains(self.recent_tweets,status)) return self.logger.debug('-- Ignoring Repeat Tweet --\n%s',status);
        status = "Frybot: "+status;
        self.twitter.tweetQueue.push(status);
        if (!self.twitter.tweeting_)
            (function cueTweet() {
            	var randomDelay = (TWO_MINUTES+(Math.random()*TEN_MINUTES));
            	randomDelay = 3000;
            	self.logger.debug('Random tweet delay: %s - %s',self.twitter.tweetQueue[0],((randomDelay/1000)/2)); 
                self.twitter.tweeting_ = setTimeout(function delayedTweet() {
                    var tweet_ = self.twitter.tweetQueue.shift();
                    if (tweet_.length>140) {
                        self.twitter.tweetQueue.splice(1,tweet_.substring(140));
                        tweet_ = tweet_.substring(0,140);
                    }
			        self.recent_tweets.push(tweet_);
                    if (self.twitter.tweetQueue.length>0) cueTweet();
                    else self.twitter.tweeting_ = false;
                    if (!self.config.tweeting) return self.logger.debug('Not Tweeting: '+tweet_);
                    self.twitter.T.post('statuses/update', { status: tweet_ }, function() { 
                        self.logger.log('Tweet posted: '+tweet_);
                    });
                }, randomDelay);
            })();
    }

}

function randIndex (arr) {
	var index = Math.floor(arr.length*Math.random());
	return arr[index];
}


