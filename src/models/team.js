var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore');

var options = { discriminatorKey: 'kind' };

// Match Schema
var teamSchema = new Schema({
  name: { type: String, default: '' },
  players: { type: Array, default: [] },
  idNumber: { type: Number, default: 0 },
},options);

teamSchema.pre('save', function(next) {
  logger.debug('team saved: %s',this.name);
  next();
});


var Team = mongoose.model('teams', teamSchema,'teams');
module.exports = Team;