/// Setup the Cisco WebexTeams Websocket

const fs = require('fs');
const Kanboard = require('kanboard');

botConfig = JSON.parse(fs.readFileSync('./bot-config.json', 'utf-8'));botConfig = JSON.parse(fs.readFileSync('./bot-config.json', 'utf-8'));botConfig = JSON.parse(fs.readFileSync('./bot-config.json', 'utf-8'));

const kburl = process.env.Kanboard_URL || botConfig.Kanboard_URL;
const kbuser = process.env.Kanboard_User || botConfig.Kanboard_User;
const kbpw = process.env.Kanboard_PW || botConfig.Kanboard_PW;
const PORT = process.env.PORT || 3001; // port used by the webhookurl 
const botadmin = process.env.botadmin || botConfig.botadmin;
const domain = []

if (process.env.WebexTeams_DOMAIN || botConfig.WebexTeams_DOMAIN) {
  domain.push(process.env.WebexTeams_DOMAIN || botConfig.WebexTeams_DOMAIN);
}

if (domain.length > 0) { domain.push('sparkbot.io'); } //workaround for issue with the spark botkit middleware not excluding the messages from the bot

console.log(kburl);

var kb = new Kanboard(kburl, kbuser, kbpw);


// Get access token
const accessToken = process.env.WebexTeams_TOKEN;
if (!accessToken) {
  console.log("No Cisco Webex Teams access token found in env variable WebexTeams_TOKEN");
  process.exit(2);
}

var WebexTeamsWebSocket = require('ciscospark-websocket-events')
var webHookUrl =  "http://localhost:"+PORT+"/ciscospark/receive"

// WebexTeams Websocket Intialization
teamswebsocket = new WebexTeamsWebSocket(accessToken)
teamswebsocket.connect(function(err,res){
   if (!err) {
         if(webHookUrl)
             teamswebsocket.setWebHookURL(webHookUrl)
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
    access_token: process.env.WebexTeams_TOKEN
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

controller.hears('help', 'direct_message,direct_mention', function(bot, message){
  bot.startConversation(message, (errno, convo) => {
    convo.say('I currently support the following commands -');
    convo.say('get project [project name]');
    convo.say('get projects');
    convo.say('shutdown [options]');
    convo.say
  });
}); 

controller.hears(['^settings$', '^show settings$'], 'direct_message', function(bot, message) { 
  const settings = [`Kanboard_URL is set for ${kburl}`, `Kanboard_User is set for ${kbuser}` ];
  domain.length > 0 ? settings.push(`Webex Teams limit_to_domain is set to ${domain}`) : settings.push('Webex Teams limit_to_domain is not set')
  bot.startConversation(message, (errno, convo) => {
    convo.say(settings.join('<br>'));
    convo.next();
  });
});

controller.hears('^get project (.*)$', 'direct_message,direct_mention', function (bot, message) {
  const projectname = message.match[1];
  bot.startConversation(message, (errno, convo) => {
    kb.execute('getProjectByName', {name: projectname}).on('success', (result) => {
        convo.say(`OK, here is the URL for the ${message.match[1]} board ${result.url.board}`);
    }).on('error', (error) => {
        convo.say(`Sorry I could not find the ${message.match[1]} board`);
        console.log(error);
    });
    convo.next();
  });
});

controller.hears('^get projects$', 'direct_message,direct_mention', function (bot, message) {
  bot.startConversation(message, (errno, convo) => {
  kb.execute('getMyProjects').on('success', (result) => {
    convo.say(`OK, here is the list`);
    for (i in result) {
      convo.say(`Project ${result[i].id} - ${result[i].name} ${result[i].url.board}`);
    }
  }).on('error', (error) => {
    convo.say(`Sorry I experienced an error ${error}`);
    console.log(error);
  });
  convo.next();
  });
});

controller.hears('^get (inactive )?tasks (for |for project )?(.*)$', 'direct_message,direct_mention', function (bot, message) {
  const projectid = Number(message.match[3]);

  // Get inactive tasks too
  console.log(message.match[1]);
  if (message.match[1]) {
    status = 0;
  } else {
    status = 1;
  }

  bot.startConversation(message, (errno, convo) => {
    kb.execute('getAllTasks', {project_id: projectid, status_id: status}).on('success', (result) => {
      if (result.length > 0) {
        convo.say(`OK, here is the list -`);
        for (i in result) {
          convo.say(`Project ${result[i].id} - ${result[i].title} ${result[i].url}`);
        }
        convo.say(`That's all I could find`);
      } else {
        convo.say(`I'm sorry but I didn't find any tasks for Project ${projectid}`);
      }
    }).on('error', (error) => {
      convo.say(`Sorry I experienced an error ${error}`);
      console.log(error);
    });
    convo.next();
  });
});

controller.hears('^[Aa]dd task to project (.*)$', 'direct_message,direct_mention', function (bot, message) {
  projectid = Number(message.match[1]);
  console.log(`Project ID is now ${projectid}`);

  kb.execute('getProjectById', {project_id: projectid}).on('success',(result) => {
    swimlane = result.default_swimlane;
    console.log(`Umm...swimlane is ${swimlane}`);
    bot.createConversation(message, (errno, convo) => {
      convo.addQuestion(`Do you want to use the default swimlane ${swimlane}?`, [
        {
          pattern: 'cancel',
          callback: function(response,convo) {
            convo.say('OK you are done!');
            convo.next();
          }
        },
        {
          pattern: bot.utterances.yes,
          callback: function(response,convo) {
            convo.say(`Great! I will use ${swimlane} for the swimlane`);
            convo.next();
          }
        },
        {
          pattern: bot.utterances.no,
          callback: function(response,convo) {
          //   convo.say('OK, let me get a list of swimlanes for the project.');
          //   const swimlanes = kb.execute('getAllSwimlanes', {project_id: projectid}).on('success', (result) => {
          //     convo.say('Here is the list - ');
          //     for (i in result) {
          //       convo.say('Swimlane ID ${result.id} is named ${result.name}');
          //     }
          //   }).on('error', (error) => {
          //     convo.say(`Sorry I experienced an error ${error}`);
          //     console.log(error);
          //   });
          //   convo.addQuestion('It looks like there is more than one swimlane, which swimlane should I use?',function(swimlane,convo) {

            convo.say('Sorry I do not have this feature implemented yet!');
            convo.next();
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            // just repeat the question
            convo.repeat();
            convo.next();
          }
        }
      ],{},'default');



      // condo.addQuestion('Which column should this go into?');
      // convo.addQuestion('What would you like to call the task?',function(taskname,convo) {
        
      //   kb.execute('getMyProjects').on('success', (result) => {
      //     convo.say('Great, I have added ${response} as id ${taskid} to the project ${projectid}');
      //   }).on('error', (error) => {
      //     convo.say(`Sorry I experienced an error ${error}`);
      //     console.log(error);
      //   });
      //   convo.next();
      convo.activate();
    });
  }).on('error', (error) => {
    bot.startConversation(message, (errno, convo) => {
      convo.say(`Sorry I could not find the project ${projectid}`);
      console.log(error);
      convo.next();
    });  
  });
});
