//The bot's main file. 
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS] });
const targetChannelId = 'Id'; // Die ID des Zielkanals hier eintragen
const targetChannelId1 = 'Id1'; 
let config;

// Lese die Konfiguration aus der JSON-Datei
try {
    const data = fs.readFileSync('data.json');
    config = JSON.parse(data);
} catch (err) {
    console.error('Fehler beim Lesen der Konfigurationsdatei: ', err);
    process.exit(1);
}

// Verwende den in der Konfiguration angegebenen Token
const TOKEN = config.token;

const activeGiveaways = new Map();

client.once('ready', () => {
    console.log(`Eingeloggt als ${client.user.tag}`);
    console.log('Bot is ready!');
    updateServerStatus();
    checkAndActivateGiveaways(); // Prüfe und aktiviere Gewinnspiele beim Start
    client.user.setActivity('Minecraft', { type: 'PLAYING' });
    // Aktualisiere alle 10 Minuten
    setInterval(updateServerStatus, 600000);
});

client.on('messageCreate', (message) => {
    // Überprüfe, ob der Bot Zugriff auf den Server hat
    if (!message.guild || !message.guild.available) {
        return;
    }

    // Überprüfe, ob eine Nachricht im richtigen Format geschrieben wurde
    const regex = /\/channels\/(\d+)\/(\d+)\/(\d+)/;
    const match = message.content.match(regex);

    if (match) {
        const guildId = match[1];
        const channelId = match[2];
        const messageId = match[3];

        // Versuche, auf den Server, den Kanal und die Nachricht zuzugreifen
        const guild = client.guilds.cache.get(guildId);
        const channel = guild.channels.cache.get(channelId);

        if (channel) {
            channel.messages.fetch(messageId)
                .then((fetchedMessage) => {
                    // Erstelle ein Embed mit den Informationen der Originalnachricht
                    const embed = new MessageEmbed()
                        .setAuthor(`${fetchedMessage.author.tag}`, fetchedMessage.author.displayAvatarURL())
                        .setDescription(`${fetchedMessage.content}`)
                        .setColor('#0099ff');

                    // Sende das Embed in den aktuellen Kanal
                    message.channel.send({ embeds: [embed] })
                        .then(() => {
                            // Lösche die Nachricht, auf die der Bot reagiert hat
                            message.delete();
                        })
                        .catch((error) => {
                            console.error(`Fehler beim Senden des Embeds: ${error.message}`);
                        });
                })
                .catch((error) => {
                    console.error(`Fehler beim Abrufen der Nachricht: ${error.message}`);
                });
        }
    }
});

client.on('guildMemberRemove', (member) => {
    const channel = member.guild.channels.cache.get('1081182553681178734');

    if (!channel) {
        console.error('Abschiedskanal nicht gefunden.');
        return;
    }

    const goodbyeEmbed = createGoodbyeEmbed(member.user.tag, member);
    channel.send({ embeds: [goodbyeEmbed] });
});

const excludedRoles = ['roleid', 'roleid1']; // Füge die IDs der ausgeschlossenen Rollen hinzu

client.on('messageReactionAdd', async (reaction, user) => {
    console.log('messageReactionAdd event received');
    if (user.bot) return;

    const giveawayData = activeGiveaways.get(reaction.message.id);

    if (giveawayData) {
        const member = reaction.message.guild.members.cache.get(user.id);
        const isExcluded = excludedRoles.some(roleId => member.roles.cache.has(roleId));

        if (isExcluded && !giveawayData.allowExcludedRoles) {
            try {
                await reaction.users.remove(user);
            } catch (error) {
                console.error('Fehler beim Entfernen der Reaktion:', error);
            }
        } else if (!giveawayData.participants.includes(user.id)) {
            giveawayData.participants.push(user.id);

            if (giveawayData.participants.length > 0) {
                giveawayData.reaction = reaction;

                // Hier wird der Text hinzugefügt
                const username = member.displayName; // oder member.user.username
                const responseText = `${username}, du nimmst am Gewinnspiel für "${giveawayData.prize}" teil!`;

                giveawayData.channel.send({ content: responseText, ephemeral: true });

                console.log(`Benutzer mit ID ${user.id} wurde zur Liste der Teilnehmer hinzugefügt.`);
            }
        }
    }
});

// Überprüfe, ob das Gewinnspiel Teilnehmer hat und sende eine Nachricht entsprechend

client.on('messageCreate', (message) => {

    if (message.author.bot) return;

    if (message.content.startsWith('!check_participants')) {

        const giveawayData = activeGiveaways.get(message.id);

        if (giveawayData && giveawayData.participants.length > 0) {

            message.reply(`Teilnehmer am Gewinnspiel für "${giveawayData.prize}": ${giveawayData.participants.join(', ')}`);

        } else {

            message.reply('Keiner hat am Gewinnspiel teilgenommen.');

        }

    }

});

client.on('messageCreate', message => {
  if (message.content.startsWith('!spendeninfo') && message.channel.id === targetChannelId1) {
    const donationInfoEmbed = new MessageEmbed()
      .setTitle('THANK YOU for using my bot ')
      .addFields(
        { name: 'Amount', value: 'Adapt to your circumstances here' }
      )
      .setColor('#0099ff') // Hier kannst du die gewünschte Farbe setzen
      .setFooter({ text:'Thank you for your support\n The xxy team'});

    message.channel.send({ embeds: [donationInfoEmbed] });
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
    console.log('messageReactionRemove event received');
    if (user.bot) return;

    const giveawayData = activeGiveaways.get(reaction.message.id);

    if (giveawayData) {
        const index = giveawayData.participants.indexOf(user.id);
        if (index !== -1) {
            giveawayData.participants.splice(index, 1);
            console.log(`User with ID ${user.id} has been removed from the list of participants.`);
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith('!start_giveaway')) {
        console.log('!start_giveaway-Befehl erkannt');
        try {
            let timeValue
            let numWinners
            let timeUnit;
            if (message.member.permissions.has('ADMINISTRATOR') || message.author.id === 'Here your userid in') {
                const args = message.content.split(' ');
                if (args.length < 4) {
                    message.reply({ content: 'Invalid use! Use: !start_giveaway <Zeitangabe> <Preis> [excludedRoles] <Gewinner>', ephemeral: true });
                    return;
                }
                const timeArg = args.slice(1, -3).join(' '); // Index aktualisiert, um die letzten 3 Argumente auszuschließen
                const prize = args[args.length - 3]; // Index für den Preis aktualisiert
                const excludedRolesOption = args[args.length - 2]; // Index für ausgeschlossene Rollen aktualisiert
                const numWinnersArg = args[args.length - 1]; // Das letzte Argument ist die Anzahl der Gewinner


                const timeUnitMatches = timeArg.match(/(\d+)\s*(\S+)/);
                if (!timeUnitMatches) {
                    message.reply({ content: 'Ungültige Zeitangabe!', ephemeral: true });
                    return;
                }

                // Parsen Sie die Zeitangabe
                timeValue = parseFloat(timeUnitMatches[1]);
                timeUnit = timeUnitMatches[2].toLowerCase();

                // Überprüfen Sie, ob die Parsen erfolgreich war
                if (isNaN(timeValue) || timeValue <= 0) {
                    message.reply({ content: 'Ungültige Zeitangabe. Sie muss eine positive Zahl sein.', ephemeral: true });
                    return;
                }

                // Überprüfen Sie, ob die Zeitangabe gültig ist
                const validTimeUnits = ['sekunde', 'sekunden', 'minute', 'minuten', 'stunde', 'stunden', 'tag', 'tage'];
                if (!validTimeUnits.includes(timeUnit)) {
                    message.reply({ content: 'Ungültige Zeiteinheit!', ephemeral: true });
                    return;
                }

                // Parsen Sie die Anzahl der Gewinner
                numWinners = parseInt(numWinnersArg);
                if (isNaN(numWinners) || numWinners <= 0) {
                    message.reply({ content: 'Ungültige Anzahl der Gewinner. Sie muss eine positive ganze Zahl sein.', ephemeral: true });
                    return;
                }

                const timeUnits = {
                    sekunde: 1,
                    sekunden: 1,
                    minute: 60,
                    minuten: 60,
                    stunde: 3600,
                    stunden: 3600,
                    tag: 86400,
                    tage: 86400
                };

                const timeInSeconds = timeValue * timeUnits[timeUnit];

                const targetChannel = client.channels.cache.get(targetChannelId);

                if (!targetChannel) {
                    message.reply({ content: 'Zielkanal nicht gefunden.', ephemeral: true });
                    return;
                }

                // Überprüfe, ob ausgeschlossene Rollen an diesem Gewinnspiel teilnehmen dürfen
                const allowExcludedRoles = excludedRolesOption.toLowerCase() === 'true';

                const roleMentions = ['Customize the roles you want here', 'role'];
                if (allowExcludedRoles) {
                    roleMentions.push(...excludedRoles);
                }

                const roleMentionsString = roleMentions.map(roleId => `<@&${roleId}>`).join(' ');

                // Funktion, um den Text im Footer abhängig von allowExcludedRoles zu erhalten
                function getFooterText(allowExcludedRoles) {
                    if (allowExcludedRoles) {
                        return 'This competition is organised by xxy.\nThere is no entitlement to a payout of the prize.';
                    } else {
                        return 'This competition is organised by xxy.\nThere is no entitlement to a payout of prizes.\nThe team is excluded from competitions!';
                    }
                }

              const embed = new MessageEmbed()
    .setTitle('🎉 Competition 🎉')
    .setColor('#FFD700')
    .addFields(
        { name: 'Rollen', value: roleMentionsString },
        { name: 'Aktion', value: 'Click on the reaction!' },
        { name: 'Preis', value: `"${prize}"` },
        { name: 'Endet in', value: `${timeValue} ${timeUnit}!` },
        { name: 'Number of winners', value: numWinners.toString() }
    )
    .setFooter(getFooterText(allowExcludedRoles));



                const giveawayMessage = await targetChannel.send({ embeds: [embed] });
                giveawayMessage.react('🎉');


                const giveawayData = {
                    channel: targetChannel,
                    prize: prize,
                    participants: [],
                    allowExcludedRoles: allowExcludedRoles,
                };

                activeGiveaways.set(giveawayMessage.id, giveawayData);

                // Aktualisiere die giveaways.json-Datei
                saveGiveawaysToJson();

                setTimeout(() => endGiveaway(giveawayMessage.id, numWinners), timeInSeconds * 1000);
            } else {
                message.reply({ content: 'Du hast keine Berechtigung, um ein Gewinnspiel zu starten!', ephemeral: true });
            }
        } catch (error) {
            console.error('Fehler beim Starten des Gewinnspiels:', error);
        }
    }

    if (message.content.startsWith('!end_giveaway')) {
        if (message.member.permissions.has('ADMINISTRATOR') || message.author.id === 'Your id') {
            const giveawayData = Array.from(activeGiveaways.values()).find((data) => {
                return data.channel.id === targetChannelId;
            });

            if (giveawayData) {
                endGiveaway(giveawayData.channel.id);
                message.reply({ content: 'Das Gewinnspiel wurde vorzeitig beendet!', ephemeral: true });
            } else {
                message.reply({ content: 'Keine aktiven Gewinnspiele gefunden!', ephemeral: true });
            }
        } else {
            message.reply({ content: 'Du hast keine Berechtigung, um ein Gewinnspiel zu beenden!', ephemeral: true });
        }
    }

});


async function saveGiveawaysToJson() {
   try {
       // Konvertiere die activeGiveaways-Map in ein Array, bevor du sie in die JSON-Datei schreibst
       const giveawaysArray = Array.from(activeGiveaways);

// Konvertiere das Array in eine Zeichenfolge
       const jsonData = JSON.stringify(giveawaysArray, null, 2);

// Speichere die Gewinnspielinformationen in der giveaways.json-Datei
       fs.writeFileSync('giveaways.json', jsonData, 'utf-8');
       console.log('Gewinnspielinformationen erfolgreich in giveaways.json gespeichert.');
   } catch (error) {
       console.error('Fehler beim Speichern der Gewinnspielinformationen in giveaways.json:', error);
   }
}

function endGiveaway(messageId, numWinners) {
    const giveawayData = activeGiveaways.get(messageId);

    if (giveawayData) {
        console.log('Teilnehmer:', giveawayData.participants); // Debug-Ausgabe
        if (giveawayData.participants.length > 0) {
            const winners = [];
            for (let i = 0; i < numWinners; i++) {
                const winnerId = giveawayData.participants[Math.floor(Math.random() * giveawayData.participants.length)];
                const winner = giveawayData.channel.guild.members.cache.get(winnerId);

                if (winner) {
                    winners.push(winner);
                }
            }

            if (winners.length > 0) {
                const winnerNames = winners.map(winner => winner.toString()).join(', ');
                giveawayData.channel.send(`🎉 Die Gewinner von "${giveawayData.prize}" sind: ${winnerNames}! 🎉`);
            } else {
                giveawayData.channel.send(`😔 Niemand hat am Gewinnspiel für "${giveawayData.prize}" teilgenommen. 😔`);
            }
        } else {
            console.log("Keine Teilnehmer gefunden.");
            giveawayData.channel.send(`😔 Niemand hat am Gewinnspiel für "${giveawayData.prize}" teilgenommen. 😔`);
        }

        activeGiveaways.delete(messageId);
    }
}


async function checkAndActivateGiveaways() {
    const targetChannel = client.channels.cache.get(targetChannelId);

    if (!targetChannel) {
        console.error(`Zielkanal mit ID ${targetChannelId} nicht gefunden.`);
        return;
    }

    try {
        const botMessages = await targetChannel.messages.fetch({ limit: 100 });

        const activeGiveawayMessages = botMessages.filter(message =>
            message.author.bot &&
            message.embeds[0]?.title?.includes('Gewinnspiel') &&
            message.embeds[0]?.description?.includes('This giveaway is organized by xxy.')
        );

        // Lese die Gewinnspielinformationen aus der JSON-Datei
        let savedGiveaways;
        try {
            const data = fs.readFileSync('giveaways.json');
            savedGiveaways = JSON.parse(data);
        } catch (err) {
            console.error('Fehler beim Lesen der JSON-Datei: ', err);
            savedGiveaways = [];
        }

        // Aktiviere die Gewinnspiele aus der JSON-Datei, die noch nicht abgelaufen sind
        savedGiveaways.forEach(savedGiveaway => {
            const now = Date.now();
            if (now < savedGiveaway.endTime) {
                // Überprüfe, ob das Gewinnspiel bereits aktiv ist, um doppelte Aktivierungen zu vermeiden
                if (!activeGiveawayMessages.some(message => message.id === savedGiveaway.messageId)) {
                    const decodedPrize = Buffer.from(savedGiveaway.prize, 'base64').toString('utf-8');
                    const timeRemaining = savedGiveaway.endTime - now;

                    // Erstelle eine neue Embed-Nachricht mit den gespeicherten Informationen
                    const embed = new MessageEmbed()
                        .setTitle('🎉 Gewinnspiel 🎉')
                        .setDescription(`${savedGiveaway.roleMentions}\n??\nPrice: ${decodedPrize}\nEndet in ${formatTime(timeRemaining / 1000)}!`)
                        .setColor('#FFD700')
                        .setFooter('Dieses Gewinnspiel wird von Mystic Celduin veranstaltet.\nEs besteht kein Anspruch auf Gewinnauszahlung.\nDas Team und Admins sind von Gewinnspielen ausgenommen!');

                    // Überprüfe, ob das Gewinnspiel bereits aktiv ist
                    const existingGiveaway = activeGiveaways.get(savedGiveaway.messageId);

                    if (existingGiveaway) {
                        // Aktualisiere die vorhandene Nachricht
                        targetChannel.messages.fetch(savedGiveaway.messageId)
                            .then((message) => {
                                message.edit({ embeds: [embed] });
                            })
                            .catch(console.error);
                    } else {
                        // Sende die Nachricht und füge die Reaktion hinzu
                        targetChannel.send({ embeds: [embed] }).then(giveawayMessage => {
                            giveawayMessage.react('🎉');

                            // Speichere die aktivierte Nachricht in der Map
                            activeGiveaways.set(giveawayMessage.id, {
                                channel: targetChannel,
                                prize: savedGiveaway.prize,
                                participants: [],
                                endTime: savedGiveaway.endTime,
                            });
                        });
                    }
                }
            }
        });
    } catch (error) {
        console.error('Fehler beim Prüfen und Aktivieren von Gewinnspielen: ', error);
    }
}

let javaStatusMessage = null;
let bedrockStatusMessage = null;

async function updateServerStatus() {
    const commonChannelId = 'Add the channel id where you want the status to be posted'; // Gemeinsamer Channel für beide Embeds
    const commonChannel = client.channels.cache.get(commonChannelId);

    if (!commonChannel) {
        console.error('Der angegebene gemeinsame Channel wurde nicht gefunden.');
        return; // Beende die Funktion, wenn der Channel nicht gefunden wurde
    }

    const bedrockStatus = await getBedrockServerStatus();
    const javaStatus = await getJavaServerStatus();

    // Erstelle separate Embeds für Bedrock und Java
    const bedrockEmbed = createEmbed('Customize the name here Bedrock', bedrockStatus);
    const javaEmbed = createEmbed('Customize your name  Java', javaStatus);

    // Bedrock Embed aktualisieren oder senden
    if (!bedrockStatusMessage) {
        commonChannel.send({ embeds: [bedrockEmbed] })
            .then((message) => {
                bedrockStatusMessage = message;
            })
            .catch((error) => {
                console.error('Fehler beim Senden der Bedrock-Nachricht:', error);
            });
    } else {
        bedrockStatusMessage.edit({ embeds: [bedrockEmbed] })
            .catch((error) => {
                console.error('Fehler beim Aktualisieren der Bedrock-Nachricht:', error);
            });
    }

    // Java Embed aktualisieren oder senden
    if (!javaStatusMessage) {
        commonChannel.send({ embeds: [javaEmbed] })
            .then((message) => {
                javaStatusMessage = message;
            })
            .catch((error) => {
                console.error('Fehler beim Senden der Java-Nachricht:', error);
            });
    } else {
        javaStatusMessage.edit({ embeds: [javaEmbed] })
            .catch((error) => {
                console.error('Fehler beim Aktualisieren der Java-Nachricht:', error);
            });
    }
}

// Funktion für den Bedrock-Serverstatus
async function getBedrockServerStatus() {
    const serverAddress = 'Enter the IP address and port here. ';
    const bedrockStatusUrl = `https://api.mcstatus.io/v2/status/bedrock/${serverAddress}`;

    try {
        const response = await axios.get(bedrockStatusUrl);
        const bedrockStatus = response.data;
        return bedrockStatus;
    } catch (error) {
        console.error('Fehler beim Abfragen des Bedrock-Serverstatus:', error);
        return null;
    }
}

// Funktion für den Java-Serverstatus
async function getJavaServerStatus() {
    const serverAddress = 'Insert the java address here';
    const javaStatusUrl = `https://api.mcstatus.io/v2/status/java/${serverAddress}`;

    try {
        const response = await axios.get(javaStatusUrl);
        const javaStatus = response.data;
        return javaStatus;
    } catch (error) {
        console.error('Fehler beim Abfragen des Java-Serverstatus:', error);
        return null;
    }
}


function createEmbed(title, serverStatus) {
    const embed = new MessageEmbed()
        .setTitle(title)
        .setColor('#00ff00'); // Grüne Farbe für Erfolg

    if (serverStatus.online) {
        const playersOnline = serverStatus.players.online;
        const maxPlayers = serverStatus.players.max;
        const version = serverStatus.version?.name || '1.20.4'; // Extrahiere die Version oder verwende 'N/A', wenn nicht verfügbar

        // Direkte Zuweisung für den Servernamen
        const serverName = 'xyz';
        const serverAdresse = 'Ip:port';

        embed.addFields(
            { name: 'Server Status', value: 'Online' },
            { name: 'Spieler', value: `${playersOnline}/${maxPlayers}` },
            { name: 'ServerName', value: serverName },
            { name: 'Serveradresse', value: serverAdresse}, 
            { name: 'Version', value: version },
            // Weitere Felder hinzufügen, falls benötigt
        );
        embed.setTimestamp();
    } else {
        embed.addField('Server Status', 'Offline');
    }

    return embed;
}


// Funktion für das Willkommens-Embed
function createWelcomeEmbed(memberTag, member) {
    const welcomeEmbed = new MessageEmbed()
        .setTitle('Willkommen auf dem Server!')
        .setColor('#00ff00') // Grüne Farbe für Erfolg
        .setDescription(`Willkommen, ${memberTag} Customize it for you `)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter('IconUrl'); // Ersetze 'URL_DEINES_GUILDIKONS' durch die URL deines hochgeladenen Bildes
    return welcomeEmbed;
}

// Funktion für das Abschieds-Embed
function createGoodbyeEmbed(memberTag, member) {
    const goodbyeEmbed = new MessageEmbed()
        .setTitle('Auf Wiedersehen!')
        .setColor('#ff0000') // Rote Farbe für Warnung
        .setDescription(`${memberTag} hat den Server verlassen. Auf Wiedersehen!`)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter('icon_url'); // Ersetze 'URL_DEINES_GUILDIKONS' durch die URL deines hochgeladenen Bildes
    return goodbyeEmbed;
}

client.login(TOKEN)
