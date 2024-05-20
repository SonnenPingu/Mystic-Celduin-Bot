const { ModalBuilder, Events, TextInputStyle, TextInputBuilder, ActionRowBuilder, Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, PermissionsBitField, Partials, Collection } = require('discord.js');
const { activeGiveaways, startGiveaway, endGiveaway, loadGiveawaysFromJson } = require('./functions/giveaways');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Required for accessing message content
        GatewayIntentBits.DirectMessages, // Required for DM interactions
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const supporterRoleId = 'SupportRoleID'; // Replace this with the ID of the supporter role

const fs = require('fs');
const axios = require('axios');
let config;

try {
    const data = fs.readFileSync('config.json');
    config = JSON.parse(data);
} catch (err) {
    console.error('Error reading config file:', err);
    process.exit(1);
}

const TOKEN = config.token;
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
// Error logging for unexpected rejections
process.on('unhandledRejection', error => {
    logError('unhandledRejection', error);
});

// Error logging for unexpected exceptions
process.on('uncaughtException', error => {
    logError('uncaughtException', error);
    process.exit(1); // Exit the process
});

// Global error logging for all other types of errors
process.on('uncaughtException', error => {
    logError('globalError', error);
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

const activeTickets = new Map(); // Map to track active tickets


client.once('ready', async () => {
    console.log(`Eingeloggt als ${client.user.tag}`);
    console.log('Bot is ready!');
    client.user.setActivity("https://mystic-celduin.de") // Replace this 
    postSupportEmbed(); 
    try {
        const data = fs.readFileSync('userdata.json', 'utf8');
        userData = JSON.parse(data);
    } catch (error) {
        console.error('Error loading user data:', error);
        // You can choose to create a new empty object if the file is not found or invalid
        userData = {};
    }
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
        const update = require('./functions/serverstatus');
        update.updateServerStatus(client); // Pass the client object to updateServerStatus
        setInterval(() => update.updateServerStatus(client), 15 * 60 * 1000); // Update every 5 minutes
    } catch (error) {
        console.error('Error updating server status:', error);
    }
});


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

async function postSupportEmbed() {
    const channelId = 'channelID'; // Replace
    const channel = client.channels.cache.get(channelId);

    if (!channel) {
        console.error('The channel was not found.');
        return;
    }

    // Check whether there are already messages in the channel
    const messages = await channel.messages.fetch({ limit: 1 });
    if (messages && messages.size > 0) {
        console.log('A message has already been found in the channel. The support message will not be sent again.');
        return;
    }
    // Send message if no message is available
    await channel.send('Be sure to adapt it to your needs!');
    // Send message for the support ticket system
    const supportTicketEmbed = new EmbedBuilder()
        .setTitle('Support-Ticket')
        .setDescription('Click on the button to create a Support-ticket.')
        .addFields({ name: 'What is it for?', value: 'For problems with the login or for problems with other players that cannot be solved by yourself' })
        .setColor('#007bff');

    // Create the button for the support ticket system
    const supportTicketButton = new ButtonBuilder()
        .setLabel('Support-Ticket')
        .setCustomId('support') // Custom ID-String
        .setStyle('Primary'); 

    await channel.send({
        embeds: [supportTicketEmbed],
        components: [new ActionRowBuilder().addComponents(supportTicketButton)],
    });
}
// Event listener for button interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'support') {

        const supportModal = new ModalBuilder()
            .setCustomId('support-modal')
            .setTitle('Support-Ticket create')
        const request = new TextInputBuilder()
            .setCustomId('Your request?')
            .setLabel("What is your request?")
            .setStyle(TextInputStyle.Short);
        const firstActionRow = new ActionRowBuilder().addComponents(request);
        supportModal.addComponents(firstActionRow);
        await interaction.showModal(supportModal); 
    }
});
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'support-modal') {
        const userId = interaction.user.id;

        // Check whether the user already has an open ticket
        if (activeTickets.has(userId)) {
            await interaction.reply({ content: 'You already have an open ticket. Please wait for an answer before creating a new ticket.', ephemeral: true });
            return;
        }
        const request = interaction.fields.getTextInputValue('Your request?');
        // Support-Channel create
        const existingTicketChannels = interaction.guild.channels.cache.filter(channel => channel.name.startsWith('ticket'));
        let ticketNumber = existingTicketChannels.size + 1;
        let channelName;
        do {
            channelName = `Ticket-${ticketNumber}`;
            ticketNumber++;
        } while (existingTicketChannels.some(channel => channel.name === channelName));
        const supportChannel = await interaction.guild.channels.create({
            name: channelName,
            type: '0',
            parent: '944657789438013440',// Change this with your support or ticket category
            topic: `Ticket created by ${interaction.user.username}`,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: supporterRoleId,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.SendMessages],
                },
            ],
        });
        // Access to the created channel variable
        console.log(`Channel-Name: ${channelName}`);
        // Create the embed
        const embed = new EmbedBuilder();
        embed.setTitle(`:construction_worker: Discord-Support-Ticket `, {
            fontSize: 30,
            fontWeight: 'bold',
        });
        embed.setDescription(`Your request?: ${request}`, {
            fontSize: 25,
            fontWeight: 'bold',
        });
        embed.setColor('#98FB98');
        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('status_resolved')
                .setLabel('Ticket Closed')
                .setStyle('Success'),
        );
        const sentMessage = await supportChannel.send({ embeds: [embed], components: [actionRow] });
        // Extract the ID of the sent embed
        const embedId = sentMessage.id;
        console.log(`ID of the sent embed: ${embedId}`);
        activeTickets.set(userId, embedId, true); 
        // Antwort mit Timeout senden
        await interaction.reply({ content: `Your  ticket has been created. A supporter will take care of your request shortly..`, ephemeral: true })
    }
});
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'status_resolved') {
        const member = interaction.member;
        if (!member.roles.cache.has(supporterRoleId)) {
            await interaction.reply({ content: "You do not have the authorization to close the ticket.", ephemeral: true });
            return;
        }
        const channel = interaction.channel;
        console.log('Delete Channel:', channel.name);
        await deleteTicket(channel, interaction); // 
    }
});
async function deleteTicket(channel, interaction, embedId) { 
    await channel.delete();
    activeTickets.delete(interaction.user.id, embedId);
}

//Link system for text and Embeds and Pics
client.on('messageCreate', async (message) => {
  
    if (!message.guild || !message.guild.available) {
        return;
    }

   
    const regex = /\/channels\/(\d+)\/(\d+)\/(\d+)/;
    const match = message.content.match(regex);

    if (match) {
        const guildId = match[1];
        const channelId = match[2];
        const messageId = match[3];

        try {
          
            const guild = await client.guilds.fetch(guildId);
            const channel = await guild.channels.fetch(channelId);

            if (channel) {
                const fetchedMessage = await channel.messages.fetch(messageId);

                const author = {
                    name: fetchedMessage.author.tag,
                    iconURL: fetchedMessage.author.displayAvatarURL(), 
                };

                const embed = new EmbedBuilder()
                    .setAuthor(author)
                    .setColor('#0099ff');

            
                if (fetchedMessage.embeds.length > 0) {
                    const originalEmbed = fetchedMessage.embeds[0];

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
             
                    if (fetchedMessage.content) {
                        embed.setDescription(fetchedMessage.content);
                    }
                    if (fetchedMessage.attachments.size > 0) {
                        const attachment = fetchedMessage.attachments.first();
                        embed.setImage(attachment.url);
                    }
                }

                await message.channel.send({ embeds: [embed] });
                message.delete();
            }
        } catch (error) {
            console.error(error);
        }
    }
});


//Giveaway Button
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'participation-button') {
        const giveawayData = activeGiveaways.get(interaction.message.id);
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!giveawayData.participants.includes(interaction.user.id)) {
            giveawayData.participants.push(interaction.user.id);
            console.log(`User ${member.user.tag} (${interaction.user.id}) has been added to the list of participants.`); 
            // Save the updated competition information in the JSON file
            await saveGiveawaysToJson();
            const username = member.displayName;
            const responseText = `${username}, you are now taking part in the competition for "${giveawayData.prize}"!`;
            await interaction.reply({ content: responseText, ephemeral: true });
        } else {
            await interaction.reply({ content: `You are already participating in the competition for "${giveawayData.prize}".`, ephemeral: true });
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
//Join Listner
client.on('guildMemberAdd', async (member) => {
    console.log('Join:', member.user.tag);
    const channelID = '1081182553681178734'; // Replache the ID !
    const channel = member.guild.channels.cache.get(channelID);
    if (!channel) {
        console.error('Welcome channel not found.');
        return;
    }
    const welcomeEmbed = createWelcomeEmbed(member.user.tag, member, member.guild.iconURL());
    channel.send({ embeds: [welcomeEmbed] });
});
//Leave Listern
client.on('guildMemberRemove', (member) => {
    console.log('Leave:', member.user.tag);

    const channelID = '1081182553681178734'; // Replache the ID !
    const channel = member.guild.channels.cache.get(channelID);

    if (!channel) {
        console.error('Goodbye channel not found..');
        return;
    }

    const goodbyeEmbed = createGoodbyeEmbed(member.user.tag, member, member.guild.iconURL());

    channel.send({ embeds: [goodbyeEmbed] })
        .then(() => {
            console.log(`Farewell embed for ${member.user.tag} sent successfully.`);
        })
        .catch(error => {
            console.error(`Error sending the farewell embed: ${error}`);
        });
});
//Dm info system for messages to the bot
client.on('messageCreate', message => {
    if (!message.author.bot && message.channel.type === 1) {
        console.log(`Private message received from ${message.author.tag}: ${message.cleanContent}`);

        message.author.send('Thanks for the Info!.');

     
        const otherUser = client.users.cache.get('USER_ID'); //  Replace 'USER_ID' with the ID of the user who is to be notified
        if (otherUser) {
            otherUser.send(`A DM with the content "${message.cleanContent}" was sent from ${message.author.tag}.`);
        }
    }
});
//Willkomens Emebed absolutely must be adapted!
function createWelcomeEmbed(memberTag, member) {
    
    if (!member || !member.user) {
        console.error('Invalid member or user object.');
        return null; 
    }
    const welcomeEmbed = new EmbedBuilder()
        .setTitle('welcome!!')
        .setColor('#00ff00')
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: 'xxxyz' }); 
    welcomeEmbed.addFields([
        {
            name: `Welcome, ${member.displayName} !`,
            value: 'xxyz',
        },
        {
            name: 'xxy',
            value: 'xyyx.',
        },
        {
            name: 'xyxxy',
            value: 'yxyx',
        },
        {
            name: 'yxx',
            value: 'xyx',
        },
        {
            name: 'yxy',
            value: 'yxyxy.',
        },
        {
            name: 'yxyyx',
            value: 'yxyx'
        },
        {
            name: 'yxyx',
            value: 'yxxyy',
        },
        {
            name: 'yxyx',
            value: 'yxyx)'
        },
    ]);
    welcomeEmbed.setTimestamp();
    return welcomeEmbed;
}

//This must also be adapted!
function createGoodbyeEmbed(memberTag, member) {
    const goodbyeEmbed = new EmbedBuilder()
        .setTitle('BYE!')
        .setColor('#ff0000')
        .setDescription(`bye ${member.displayName}`)
        .setFooter({ text: 'xxxx' }) 
        .addFields([
            {
                name: 'xxx.',
                value: 'xxx.',
            },
            {
                name: 'You were a valuable member of our community and we will miss you',
                value: 'We hope you will come back soon!',
            },

        ]);
    if (member.user && member.displayAvatarURL) {
        goodbyeEmbed.setThumbnail(member.displayAvatarURL({ dynamic: true }));
    } else {
        goodbyeEmbed.setThumbnail('https://discord.com/assets/6debd47ed13483642cf09e832ed0bc1b.png'); // Standard-Avatar-URL
    }
    goodbyeEmbed.setTimestamp();
    return goodbyeEmbed;
}
// Load user data from JSON file
let userData = loadUserData();

function loadUserData() {
    try {
        const filePath = 'userdata.json';
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(rawData);
        } else {
            console.log(`${filePath} does not exist. Starting with an empty userData.`);
            return {}; // Return an empty object if the file does not exist
        }
    } catch (err) {
        console.error('Error loading user data:', err);
        return {}; // Return an empty object on error
    }
}

// Event listeners to track messages and voice activity
client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignore messages from bots

    const userId = message.author.id;
    userData[userId] = userData[userId] || { messageCount: 0, voiceMinutes: 0, joinedTimestamp: null };
    userData[userId].messageCount++;

    console.log(`Message received from user ${userId}. Total messages: ${userData[userId].messageCount}`);
    saveUserData(); // Save updated user data
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = oldState.member?.id || newState.member?.id;
    if (!userId) return;

    userData[userId] = userData[userId] || { messageCount: 0, voiceMinutes: 0, joinedTimestamp: null };

    if (!oldState.channel && newState.channel) {
        // User joined a voice channel
        userData[userId].joinedTimestamp = Date.now();
        console.log(`User ${userId} joined a voice channel at ${userData[userId].joinedTimestamp}`);
    } else if (oldState.channel && !newState.channel) {
        // User left a voice channel
        const joinedTimestamp = userData[userId].joinedTimestamp || Date.now(); // Fallback if timestamp is missing
        const duration = Math.floor((Date.now() - joinedTimestamp) / 60000); // Duration in minutes
        userData[userId].voiceMinutes += duration;
        userData[userId].joinedTimestamp = null; // Reset the timestamp
        console.log(`User ${userId} left a voice channel. Duration: ${duration} minutes. Total voice minutes: ${userData[userId].voiceMinutes}`);
        saveUserData(); // Save updated user data
    }
});

// Function to save user data to JSON file
function saveUserData() {
    try {
        const filePath = 'userdata.json';
        const jsonData = JSON.stringify(userData, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        console.log('User data saved to userdata.json');
    } catch (err) {
        console.error('Error saving user data:', err);
    }
}
        client.login(TOKEN);
