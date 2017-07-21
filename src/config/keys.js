var fs = require('fs');

module.exports = function() {
    var localConfig = {};

    try {
        localConfig = fs.readFileSync(this.local_keys_path).toString();
        localConfig = JSON.parse(localConfig);
        this.logger.debug('Local Keys Loaded; Loading Development Environment');
    }
    catch (err) {
        this.logger.debug('Local Keys Not Found; Loading Production Environment');
        this.localConfig = {};
    }

    // Google
    this.Google_service_email = localConfig.Google_service_email || process.env.Google_service_email;
    this.Google_keyFile = localConfig.Google_keyFile || process.env.Google_keyFile;
    this.Google_key = localConfig.Google_key || process.env.Google_key;
    this.Google_Oauth_Opts = {
        "email": this.Google_service_email,
        "key": this.Google_key,
        "keyFile": this.Google_keyFile
    };
    // It Is What It Is Google Sheet
    this.Google_ItIsWhatItIs_Spreadsheet_ID = localConfig.Google_ItIsWhatItIs_Spreadsheet_ID || process.env.Google_ItIsWhatItIs_Spreadsheet_ID;
    this.ItIsWhatItIs_statsSheetID = 'ot3ufy3';
    this.ItIsWhatItIs_nicofactsSheetID = 'om5ojbr';
    this.ItIsWhatItIs_referencesSheetID = 'ofz9sxs';
    // GroupMe API
    this.GroupMe_AccessToken = localConfig.GroupMe_AccessToken || process.env.GroupMe_AccessToken;

    // Mongo
    this.MONGODB_URI = localConfig.MONGODB_URI || process.env.MONGODB_URI;
    if (process.env.NODE_ENV!='production') this.MONGODB_URI = localConfig.MONGODB_URI_dev;

    // Twitter
    this.Twitter_access_token = localConfig.Twitter_access_token || process.env.Twitter_access_token;
    this.Twitter_access_token_secret = localConfig.Twitter_access_token_secret || process.env.Twitter_access_token_secret;
    this.Twitter_consumer_key = localConfig.Twitter_consumer_key || process.env.Twitter_consumer_key;
    this.Twitter_consumer_secret = localConfig.Twitter_consumer_secret || process.env.Twitter_consumer_secret;
    this.TwitterConfig = {
        consumer_key: this.Twitter_consumer_key, 
        consumer_secret: this.Twitter_consumer_secret,
        access_token: this.Twitter_access_token,
        access_token_secret: this.Twitter_access_token_secret
    };

    if (!this.debugging) {
      this.botName = "Frybot";
      this.GroupMe_group_ID = localConfig.Frybot_GroupMe_group_ID  || process.env.GroupMe_group_ID;
      this.botID = localConfig.Frybot_botID || process.env.GroupMe_bot_ID;
      this.GroupMe_group_name = '#ItIs!WhatItIs!';
    }
    else {
      this.botName = "Naivi";
      this.GroupMe_group_ID = localConfig.Naivi_GroupMe_group_ID || process.env.GroupMe_group_ID;
      this.botID = localConfig.Naivi_botID || process.env.GroupMe_bot_ID;
      this.GroupMe_group_name = 'Talking to Myself';
    }
    this.GroupMe_devbot_ID = localConfig.GroupMe_devbot_ID || process.env.GroupMe_devbot_ID;
}