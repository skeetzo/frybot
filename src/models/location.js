var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Location Schema
var locationSchema = new Schema({
  name: { type: String, default: config.homeLocationName },
  address: { type: String, default: config.homeLocation },
},options);

locationSchema.pre('save', function(next) {
  logger.debug('player saved: %s',this.name);
  next();
});

// Statics
// Methods
locationSchema.methods.isHome = function() {
  if (this.name===config.homeLocationName)
    return true;
  return false;
}

var Location = mongoose.model('locations', locationSchema,'locations');
module.exports = Location;