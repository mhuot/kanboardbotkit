/// Setup the Cisco Spark Websocket

const fs = require('fs');

botConfig = JSON.parse(fs.readFileSync('./bot-config.json', 'utf-8'));

const accessToken = process.env.SPARK_TOKEN;
if (!accessToken) {
  console.log("No Cisco Spark access token found in env variable SPARK_TOKEN");
  process.exit(2);
}

var SparkWebSocket = require('ciscospark-websocket-events')

var PORT = process.env.PORT || 3000

var webHookUrl =  "http://localhost:"+PORT+"/ciscospark/receive"

sparkwebsocket = new SparkWebSocket(accessToken)
sparkwebsocket.connect(function(err,res){
   if (!err) {
         if(webHookUrl)
             sparkwebsocket.setWebHookURL(webHookUrl)
   }
   else {
        console.log("Error starting up websocket: "+err)
   }
})

//////// Bot Kit //////

var Botkit = require('botkit');

var controller = Botkit.sparkbot({
    debug: true,
    log: true,
    public_address: "https://localhost",
    ciscospark_access_token: process.env.SPARK_TOKEN
});

var bot = controller.spawn({
});

controller.setupWebserver(PORT, function(err, webserver) {

 //setup incoming webhook handler
  webserver.post('/ciscospark/receive', function(req, res) {
            res.sendStatus(200)
            controller.handleWebhookPayload(req, res, bot);
  });

});

controller.hears('hello', 'direct_message,direct_mention', function(bot, message) {
    bot.reply(message, 'Hi');
});

controller.on('direct_mention', function(bot, message) {
    bot.reply(message, 'You mentioned me and said, "' + message.text + '"');
});

controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
});