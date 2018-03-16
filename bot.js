let Discord = require('discord.js');
let logger = require('winston');
let config = require("./config.json");
let request = require('request');
let express = require('express');
let app = express();

app.set('port', (process.env.PORT || 5000));
app.get('/', function (request, response) {
    let result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function () {
    console.log('App is running, server is listening on port ', app.get('port'));
});

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';


let bot = new Discord.Client();
bot.login(config.token);

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.user.username + ' - (' + bot.user.id + ')');
});


bot.on('message', function (message) {
    if (message.content.substring(0, 1) === '!') {
        let args = message.content.substring(1).split(' ');
        let cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            case 'ping':
                message.channel.send('Pong!')
                break;
            case 'stats':
                getStatsForPlayer(message, args[0], args[1]);
                break;
            default:
                message.channel.send('Command is not configured');
                break;
        }
    }
});

function getStatsForPlayer(message, pName, platform) {
    if ((pName != null || pName !== undefined) &&
        (platform != null || platform !== undefined)) {
        platform = getPlatform(platform);
        message.channel.send('Processing... it can take time');
        request.get(`https://api.r6stats.com/api/v1/players/${pName}?platform=${platform}`, {json: true},
            function (err, res, player) {
                if (!err && res.statusCode === 200) {
                    player = player.player;
                    logger.info("R6STATS get player, Success")
                    request.get(`https://api.r6stats.com/api/v1/players/${pName}/seasons?platform=${platform}`, {json: true},
                        function (err, res, ranks) {

                            if (!err && res.statusCode === 200) {
                                let seasonNb = Object.keys(ranks.seasons).sort().pop()
                                let season = ranks.seasons[seasonNb];
                                logger.info(season);
                                const embed = new Discord.RichEmbed()
                                    .setTitle("Player statistics")
                                    .setAuthor(player.username, "https://ubisoft-avatars.akamaized.net/" + player.ubisoft_id + "/default_146_146.png")
                                    .setColor(0x00AE86)
                                    .setFooter("PulsionStats - Nitratz 2018", "https://raw.githubusercontent.com/Nitratz/PulsionStats/master/pulsion.png")
                                    .setThumbnail("https://raw.githubusercontent.com/Nitratz/PulsionStats/master/Ranks/rank" + season.emea.ranking.rank + ".png")
                                    .setTimestamp()
                                    .setURL("https://game-rainbow6.ubi.com/fr-fr/uplay/player-statistics/" + player.ubisoft_id + "/multiplayer")
                                    .addField("CASUAL",
                                        "WL ratio : " + player.stats.casual.wlr
                                        + "\nKD ratio : " + player.stats.casual.kd +
                                        "\nTime Played : " + fancyTimeFormat(player.stats.casual.playtime), true)
                                    .addField("RANKED",
                                        "MMR : " + precisionRound(season.emea.ranking.rating, 0) +
                                        "\nWL ratio : " + player.stats.ranked.wlr +
                                        "\nKD ratio : " + player.stats.ranked.kd +
                                        "\nTime Played : " + fancyTimeFormat(player.stats.ranked.playtime), true)
                                    .addBlankField()
                                    .addField("MISC",
                                        "Revives done : " + player.stats.overall.revives +
                                        "\nSuicides commited : " + player.stats.overall.suicides +
                                        "\nReinforcements deployed : " + player.stats.overall.reinforcements_deployed +
                                        "\nBarricades builts : " + player.stats.overall.barricades_built, true)
                                    .addField("---",
                                        "Bullets fired : " + player.stats.overall.bullets_fired +
                                        "\nBullets hits : " + player.stats.overall.bullets_hit +
                                        "\nBullet hit ratio : " + precisionRound((player.stats.overall.bullets_hit / player.stats.overall.bullets_fired) * 100, 2), true);

                                message.channel.send({embed})
                            }
                            else
                                message.channel.send('An error has occured');
                        });
                }
                else
                    message.channel.send('An error has occured');
            });
    } else {
        bot.sendMessage({
            to: channelID,
            message: 'Enter a valid player name or a valid platform [PC, XBOX, PS4]'
        });
    }
}

function getPlatform(platform) {
    if (platform === "PC") {
        return "uplay";
    } else if (platform === "PS4") {
        return "ps4";
    } else if (platform === "XBOX") {
        return "xone";
    }
}

function precisionRound(number, precision) {
    let factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}

function fancyTimeFormat(time) {
    let hrs = ~~(time / 3600);
    let mins = ~~((time % 3600) / 60);
    let secs = time % 60;
    let ret = "";

    if (hrs > 0)
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}
