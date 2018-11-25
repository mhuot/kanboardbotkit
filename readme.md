# kanboardbotkit
This project will implement a [Cisco WebEx Teams](https://teams.webex.com/signin) bot using [Botkit](https://botkit.ai) to interact with an instance of [Kanboard](https://kanboard.org/). The project uses the [experimental websocket library](https://github.com/marchfederico/ciscospark-websocket-events) for Webex Teams, this allows you to not expose your bot on the Internet and you won't register a Webhook. 

# Configuration
## Cisco Webex Teams
1. [Create bot](https://developer.webex.com/my-apps/new/bot)
2. Set env for token in bash `export SPARK_TOKEN=`
3. Invite bot to a space

## kanboard
The connection information for the kanboard server is provided in the bot-config.json.

# Usage
## example.js
This is a very basic bot that will allow you to validate that the bot mechanics are working independent of kanboard.
To start issue `node example.js` in the source directory.

# Goals
Actions supported add task, move task, list tasks and maybe a summary for initial use case