var mongoose = require('mongoose'),
    config = require('../config/index.js'),
    logger = config.logger;

// squelch mpromise is deprecated warning
mongoose.Promise = global.Promise;

// const connection = mongoose.createConnection(config.MONGODB_URI);

mongoose.connect(config.MONGODB_URI);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {  
  logger.debug('Mongoose connection open');
}); 

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
  logger.debug('Mongoose connection error: ' + err);
}); 

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  logger.debug('Mongoose connection disconnected'); 
  logger.debug('Reconnecting to MongoDB...');
  mongoose.connect(config.MONGODB_URI);
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    logger.debug('Mongoose connection disconnected through app termination'); 
    process.exit(0); 
  }); 
}); 