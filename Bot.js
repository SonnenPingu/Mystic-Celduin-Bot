const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { activeGiveaways, startGiveaway, endGiveaway, loadGiveawaysFromJson } = require('./commands/giveaways'); 
const excludedRoles = 'your ID'

// Load the config file once at the beginning
let config;
try {
    const data = fs.readFileSync('config.json');
    config = JSON.parse(data);
} catch (err) {
    console.error('Error reading config file:', err);
    process.exit(1);
}

const TOKEN = config.token;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

// Load commands (optional)
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);

        // Check if the command module has the expected properties
        if (!command || !command.data || !command.data.name) {
            console.error(`Invalid command file: ${file}. Missing 'data' or 'data.name' property.`);
            continue; // Skip to the next file
        }

        client.commands.set(command.data.name, command);
        console.log(`Slash command loaded: ${command.data.name}`);
    } catch (error) {
        console.error(`Error loading command file ${file}:`, error);
    }
}

process.on('unhandledRejection', error => {
    logError('unhandledRejection', error);
});

process.on('uncaughtException', error => {
    logError('uncaughtException', error);
    process.exit(1); // Exit the process
});

function logError(type, error) {
    const errorLog = {
        type: type,
        timestamp: new Date().toISOString(),
        error: error.stack || error.toString()
    };
    fs.appendFileSync('errorLog.json', JSON.stringify(errorLog) + '\n');
    console.error(`${type}:`, error);
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    try {
        await client.commands.get(interaction.commandName).execute(interaction);
        console.log(`Slash command "${interaction.commandName}" executed successfully.`);
    } catch (error) {
        console.error(`Error executing slash command "${interaction.commandName}":`, error);
        if (interaction.deferred) {
            await interaction.editReply({ content: 'An error occurred.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'An error occurred.', ephemeral: true });
        }
    }
});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
console.log('Bot is ready!');
loadGiveawaysFromJson(client);
    try {
        if (config.registerCommandsGlobally) {
            await client.application.commands.set(client.commands.map(cmd => cmd.data));
            console.log('Slash commands registered globally.');
        } else {
            const guildId = config.guildId;
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await guild.commands.set(client.commands.map(cmd => cmd.data));
                console.log(`Slash commands registered for guild: ${guild.name}`);
            } else {
                console.error(`Guild with ID ${guildId} not found.`);
            }
        }
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
    try {
	const update = require('./commands/serverstatus');
        update.updateServerStatus(client); // Pass the client object to updateServerStatus
        setInterval(() => update.updateServerStatus(client), 5 * 60 * 1000); // Update every 5 minutes
    } catch (error) {
        console.error('Error updating server status:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'teilnahme-button') {
        const giveawayData = activeGiveaways.get(interaction.message.id);
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!giveawayData.participants.includes(interaction.user.id)) {
            giveawayData.participants.push(interaction.user.id);
            console.log(`Benutzer mit ID ${interaction.user.id} wurde zur Liste der Teilnehmer hinzugefügt.`);
            // Speichere die aktualisierten Gewinnspielinformationen in der JSON-Datei
            await saveGiveawaysToJson();
            const username = member.displayName;
            const responseText = `${username}, du nimmst jetzt am Gewinnspiel für "${giveawayData.prize}" teil!`;
            await interaction.reply({ content: responseText, ephemeral: true });
        } else {
            await interaction.reply({ content: `Du nimmst bereits am Gewinnspiel für "${giveawayData.prize}" teil.`, ephemeral: true });
        }
    }
});

async function saveGiveawaysToJson() {
    try {
        // Convert activeGiveaways Map to an array
        const giveawaysArray = Array.from(activeGiveaways, ([key, value]) => {
            // Modify giveaway data to convert BigInts to strings
            const modifiedValue = {
                ...value,
                channel: value.channel.id, // Replace Discord.js Channel object with its ID (string)
                interaction: null,  // Optionally remove the interaction object
                participants: value.participants.map(p => p.toString()), // Convert participants (if BigInt) to strings
                endTime: Number(value.endTime) // Convert endTime (if BigInt) to number
            };
            return [key, modifiedValue];
        });

        const jsonData = JSON.stringify(giveawaysArray, null, 2);
        fs.writeFileSync('giveaways.json', jsonData, 'utf-8');
        console.log('Giveaway information saved to giveaways.json successfully.');
    } catch (error) {
        console.error('Error saving giveaway information to giveaways.json:', error);
    }
}

client.on('messageCreate', async (message) => {
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

        try {
            // Versuche, auf den Server, den Kanal und die Nachricht zuzugreifen
            const guild = await client.guilds.fetch(guildId);
            const channel = await guild.channels.fetch(channelId);

            if (channel) {
                const fetchedMessage = await channel.messages.fetch(messageId);

                const author = {
                    name: fetchedMessage.author.tag,
                    iconURL: fetchedMessage.author.displayAvatarURL(), // Optional: URL des Avatars des Autors
                };

                const embed = new EmbedBuilder()
                    .setAuthor(author)
                    .setColor('#0099ff');

                // Wenn die ursprüngliche Nachricht ein Embed ist, übernehme alle Eigenschaften des eingebetteten Objekts
                if (fetchedMessage.embeds.length > 0) {
                    const originalEmbed = fetchedMessage.embeds[0];
                    
                    // Kopiere alle Felder des ursprünglichen Embeds
                    if (originalEmbed.title) embed.setTitle(originalEmbed.title);
                    if (originalEmbed.description) embed.setDescription(originalEmbed.description);
                    if (originalEmbed.url) embed.setURL(originalEmbed.url);
                    if (originalEmbed.color) embed.setColor(originalEmbed.color);
                    if (originalEmbed.timestamp) embed.setTimestamp(new Date(originalEmbed.timestamp));
                    if (originalEmbed.footer) embed.setFooter(originalEmbed.footer);
                    if (originalEmbed.image) embed.setImage(originalEmbed.image.url);
                    if (originalEmbed.thumbnail) embed.setThumbnail(originalEmbed.thumbnail.url);
                    if (originalEmbed.author) embed.setAuthor(originalEmbed.author);
                    if (originalEmbed.fields) embed.addFields(originalEmbed.fields);
                } else { 
                    // Wenn die ursprüngliche Nachricht keine eingebetteten Objekte enthält, füge den Text und Bilder (falls vorhanden) in das neue Embed ein
                    if (fetchedMessage.content) {
                        embed.setDescription(fetchedMessage.content);
                    }
                    if (fetchedMessage.attachments.size > 0) {
                        const attachment = fetchedMessage.attachments.first();
                        embed.setImage(attachment.url);
                    }
                }

                // Sende das Embed in den aktuellen Kanal
                await message.channel.send({ embeds: [embed] });
                message.delete();
            }
        } catch (error) {
            console.error(error);
        }
    }
});

const welcomeGoodbyeEmbeds = require('./joinleave'); // Adjust the path if needed

client.on('guildMemberAdd', (member) => {
    const welcomeChannel = member.guild.channels.cache.get('YOUR_WELCOME_CHANNEL_ID'); // Replace with your channel ID
    if (welcomeChannel) {
        welcomeChannel.send({ embeds: [welcomeGoodbyeEmbeds.createWelcomeEmbed(member)] });
    }
});

client.on('guildMemberRemove', (member) => {
    const goodbyeChannel = member.guild.channels.cache.get('YOUR_GOODBYE_CHANNEL_ID'); // Replace with your channel ID
    if (goodbyeChannel) {
        goodbyeChannel.send({ embeds: [welcomeGoodbyeEmbeds.createGoodbyeEmbed(member)] });
    }
});

client.login(TOKEN);
