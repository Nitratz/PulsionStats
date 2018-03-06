let Discord = require('discord.io');
let logger = require('winston');
let auth = require('./auth.json');
let request = require('request');
var express = require('express');
var app     = express();

app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});


bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        logger.info(args);
        switch(cmd) {
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
                break;
            case 'stats':
            getStatsForPlayer(channelID, args[0], args[1]);
            break;
            default:
            bot.sendMessage({
                to: channelID,
                message: 'Command is not configured'
            });
            break;
         }
     }
});

function getStatsForPlayer(channelID, pName, platform) {
  if ((pName != null || pName != undefined) &&
  (platform != null || platform != undefined)) {
    platform = getPlatform(platform)
    request.get(`https://api.r6stats.com/api/v1/players/${pName}?platform=${platform}`, {json: true},
    function(err, res, body) {
      if (!err && res.statusCode === 200) {
        logger.info(body)
        bot.sendMessage({
            to: channelID,
            message: body.player.username +
            "\nLevel : " + body.player.stats.progression.level +
            "\n\n=== RANKED ===\n\n" +
            "W/L ratio : " + body.player.stats.ranked.wlr +
            "\nK/D ratio : " + body.player.stats.ranked.kd +
            "\nTime Played : " + fancyTimeFormat(body.player.stats.ranked.playtime) +
            "\n\n=== CASUAL ===\n\n" +
            "W/L ratio : " + body.player.stats.casual.wlr +
            "\nK/D ratio : " + body.player.stats.casual.kd +
            "\nTime Played : " + fancyTimeFormat(body.player.stats.casual.playtime) +
            "\n\n=== MISC ===\n\n" +
            "Revives done : " + body.player.stats.overall.revives +
            "\nSuicides commited : " + body.player.stats.overall.suicides +
            "\nReinforcements deployed : " + body.player.stats.overall.reinforcements_deployed +
            "\nBarricades builts : " + body.player.stats.overall.barricades_built +
            "\nBullets fired : " + body.player.stats.overall.bullets_fired +
            "\nBullets hits : " + body.player.stats.overall.bullets_hit +
            "\nBullet hit ratio : " + precisionRound((body.player.stats.overall.bullets_hit / body.player.stats.overall.bullets_fired) * 100, 2)

        });
      }
  });
  } else {
    bot.sendMessage({
        to: channelID,
        message: 'Enter a valid player name or a valid platform [PC, XBOX, PS4]'
    });
  }
}

function getPlatform(platform) {
  if (platform == "PC") {
    return "uplay";
  } else if (platform == "PS4") {
    return "ps4";
  } else if (platform == "XBOX") {
    return "xone";
  }
}

function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function fancyTimeFormat(time)
{
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = time % 60;

    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}
