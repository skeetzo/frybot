var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// User Schema
var nicoFactSchema = new Schema({
  fact: { type: String, required: true },
  number:{ type: Number, default: Math.floor(Math.random() * 1000) },
  author: { type: String, default: 'George' },
  echoed: { type: Number, default: 0 },
  tweet_count: { type: Number, default: 0 },
  like_count: { type: Number, default: 0 },
},options);

nicoFactSchema.pre('save', function(next) {
  logger.debug('nico fact #%s saved: %s',this.number,this.fact);
  next();
});

// Statics
// Methods

var NicoFact = mongoose.model('nicofacts', nicoFactSchema,'nicofacts');
module.exports = NicoFact;