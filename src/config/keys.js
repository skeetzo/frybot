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

    // Amazon S3
    this.AWS_ACCESS_KEY = localConfig.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY;
    this.AWS_SECRET_KEY = localConfig.AWS_SECRET_KEY || process.env.AWS_SECRET_KEY;
    this.S3_BUCKET = localConfig.S3_BUCKET || process.env.S3_BUCKET;
    // Google
    this.Google_service_email = localConfig.Google_service_email || process.env.Google_service_email;
    this.Google_keyFile = localConfig.Google_keyFile || process.env.Google_keyFile;
    this.Google_key = process.env.Google_key;
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