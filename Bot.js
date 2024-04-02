const { ModalBuilder, Events, TextInputStyle, TextInputBuilder, ActionRowBuilder, Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, PermissionsBitField,Partials } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent, // Required for accessing message content
    GatewayIntentBits.DirectMessages, // Required for DM interactions
    GatewayIntentBits.DirectMessageTyping, // Optional for detecting typing in DMs
  ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});
const supporterRoleId = 'SUPPORTID'; // Replace this with the ID of the supporter role
const targetChannelId = 'TARGTCHANNELID'; // Enter the ID of the target channel here
const excludedRoles = ['ID1', 'ID2']; // Add the IDs of the excluded roles
const fs = require('fs');
const axios = require('axios');
let config;

try {
    const data = fs.readFileSync('data.json');
    config = JSON.parse(data);
} catch (err) {
    console.error('Fehler beim Lesen der Konfigurationsdatei: ', err);
    process.exit(1);
}

process.on('unhandledRejection', error => {
    logError('unhandledRejection', error);
});


process.on('uncaughtException', error => {
    logError('uncaughtException', error);
    process.exit(1); // Exit the process
});

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

const TOKEN = config.token;
const activeTickets = new Map(); 
const activeGiveaways = new Map();

client.once('ready', async () => {
    console.log(`Eingeloggt als ${client.user.tag}`);
    console.log('Bot is ready!');
    client.user.setActivity("Bot By SonnenPingu")
    postSupportEmbed(); 
 
    updateServerStatus();
    setInterval(updateServerStatus, 600000);
});


async function postSupportEmbed() {
    const channelId = 'YourSUPPORTChannelID';
    const channel = client.channels.cache.get(channelId);

    if (!channel) {
        console.error('The channel was not found.');
        return;
    }

 
    const messages = await channel.messages.fetch({ limit: 1 });
    if (messages && messages.size > 0) {
        console.log('A message has already been found in the channel. The support message will not be sent again.');
        return;
    }


    await channel.send('YOUR SUPPORT TEXT');
  
    const supportTicketEmbed = new EmbedBuilder()
        .setTitle('Ticket')
        .setDescription('Click on the button to create a Mystic ticket.')
        .setColor('#007bff');

    
    const supportTicketButton = new ButtonBuilder()
        .setLabel('Ticket') 
        .setCustomId('support') 
        .setStyle('Primary'); 

    await channel.send({
        embeds: [supportTicketEmbed],
        components: [new ActionRowBuilder().addComponents(supportTicketButton)],
    });
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'support') {

        const supportModal = new ModalBuilder()
            .setCustomId('support-modal')
            .setTitle('Ticket createn')
        const Anliegen = new TextInputBuilder()
            .setCustomId('Your request')
            .setLabel("Whats your request?")
            .setStyle(TextInputStyle.Short);
        const firstActionRow = new ActionRowBuilder().addComponents(Anliegen);
        supportModal.addComponents(firstActionRow);
        await interaction.showModal(supportModal); 
    }
});
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'support-modal') {
        const userId = interaction.user.id;

        
        if (activeTickets.has(userId)) {
            await interaction.reply({ content: 'You already have an open ticket. Please wait for an answer before creating a new ticket.', ephemeral: true });
            return;
        }
        const Yourrequest = interaction.fields.getTextInputValue('Your request');
      
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
            parent: 'Replace WITH your category',
            topic: `Ticket create: ${interaction.user.username}`,
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
       
        console.log(`Channel-Name: ${channelName}`);
     
        const embed = new EmbedBuilder();
        embed.setTitle(`:construction_worker: Discord-Support-Ticket `, {
            fontSize: 30,
            fontWeight: 'bold',
        });
        embed.setDescription(`Your request: ${Yourrequest}`, {
            fontSize: 25,
            fontWeight: 'bold',
        });
        embed.setColor('#98FB98');
       
        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('status_gelöst')
                .setLabel('Ticket closed')
                .setStyle('Success'),
        );
       
        const sentMessage = await supportChannel.send({ embeds: [embed], components: [actionRow] });
      
        const embedId = sentMessage.id;
        console.log(`ID des gesendeten Embeds: ${embedId}`);
        activeTickets.set(userId, embedId, true);
       
        await interaction.reply({ content: `Your ticket has been created. A supporter will take care of your request shortly.`, ephemeral: true })
    }
});
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'status_gelöst') {
       const member = interaction.member;
        if (!member.roles.cache.has(supporterRoleId)) {
            await interaction.reply({ content: "You do not have the authorization to close the ticket.", ephemeral: true });
            return;
        }
        const channel = interaction.channel;
        console.log('Lösche Kanal:', channel.name);
        await deleteTicket(channel, interaction); // 
    }
});
async function deleteTicket(channel, interaction, embedId) { 
    await channel.delete();

    activeTickets.delete(interaction.user.id, embedId);
}
client.on('guildMemberAdd', async (member) => {
    console.log('Join:', member.user.tag);
    const channelID = 'welcome'; //  Replace with your welcome channel ID!
    const channel = member.guild.channels.cache.get(channelID);
    if (!channel) {
        console.error('Welcomekanal nicht gefunden.');
        return;
    }
    const welcomeEmbed = createWelcomeEmbed(member.user.tag, member, member.guild.iconURL());
    channel.send({ embeds: [welcomeEmbed] });
});
client.on('guildMemberRemove', (member) => {
    console.log('Leave:', member.user.tag);
    const channelID = 'goodbye'; // Replace with your goodbye channel ID!
    const channel = member.guild.channels.cache.get(channelID);
    if (!channel) {
        console.error('Abschiedskanal nicht gefunden.');
        return;
    }
    const goodbyeEmbed = createGoodbyeEmbed(member.user.tag, member, member.guild.iconURL());
    channel.send({ embeds: [goodbyeEmbed] });
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'teilnahme-button') {
        const giveawayData = activeGiveaways.get(interaction.message.id);
        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!giveawayData.allowExcludedRoles) {
            const memberRoles = member.roles.cache.map(role => role.id);
            const hasExcludedRole = excludedRoles.some(role => memberRoles.includes(role));
            if (hasExcludedRole) {
                await interaction.reply({ content: 'Unfortunately, you are not allowed to take part in this competition.', ephemeral: true });
                return;
            }
        }
        if (!giveawayData.participants.includes(interaction.user.id)) {
            giveawayData.participants.push(interaction.user.id);
            console.log(`User with ID ${interaction.user.id} has been added to the list of participants`);
   
            await saveGiveawaysToJson();
            const username = member.displayName;
            const responseText = `${username}, you are now taking part in the competition for "${giveawayData.prize}"!`;
            await interaction.reply({ content: responseText, ephemeral: true });
        } else {
            await interaction.reply({ content: `You are already taking part in the competition for "${giveawayData.prize}" `, ephemeral: true });
        }
    }
});
let poll;
async function handleUmfrage(message) {

    const args = message.content.slice("!umfrage".length).trim().split(" ");
    const question = args.join(" ");
    const timeInput = args.pop();
    const roleId1 = '1093589980720410655'; // Replace this with the ID of the first role
    const roleId2 = '917796323921637446'; // Replace this with the ID of the second role
    let votesYes = 0;
    let votesAbstention = 0;
    let votesNo = 0;
    const lastSelectedOptions = new Map();
    if (question && timeInput) {
        const timeInSeconds = parseTimeInput(timeInput);
        if (!isNaN(timeInSeconds)) {
    
            message.channel.send(`A poll: "${question}" has been started! It takes "${timeInput}".<@&${roleId1}> <@&${roleId2}>`);
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setLabel('yes').setStyle('Primary').setCustomId('Yes'),
                    new ButtonBuilder().setLabel('Abstention').setStyle('Secondary').setCustomId('Abstention'),
                    new ButtonBuilder().setLabel('No').setStyle('Secondary').setCustomId('No'),
                );
            const poll = new EmbedBuilder()
                .setTitle("Poll")
                .setDescription(question)
                .addFields([
                    { name: "Yes", value: `${votesYes} Stimmen` },
                    { name: "Abstention", value: `${votesAbstention} Stimmen` },
                    { name: "No", value: `${votesNo} Stimmen` },
                ]);
            
            const sentMsg = await message.channel.send({ embeds: [poll], components: [actionRow] });
            message.delete().catch(error => console.error('Error when deleting the command:', error));
            setTimeout(() => endUmfrage(sentMsg), timeInSeconds * 1000);
            const collector = message.channel.createMessageComponentCollector({
                filter: (interaction) => interaction.isButton(),
                time: timeInSeconds * 1000,
            });
            collector.on('collect', async (interaction) => {
    
                switch (interaction.customId) {
                    case 'Yes':
                        updateVote(interaction, 'Yes');
                        break;
                    case 'Enthaltung':
                        updateVote(interaction, 'Abstention');
                        break;
                    case 'Nein':
                        updateVote(interaction, 'No');
                        break;
                }
            });

            function updateVote(interaction, option) {
                const userId = interaction.user.id;
                const lastOption = lastSelectedOptions.get(userId);
                if (lastOption && lastOption !== option) {
                    switch (lastOption) {
                        case 'Yes':
                            votesyes--;
                            break;
                        case 'Abstention':
                            votesAbstention--;
                            break;
                        case 'No':
                            votesNo--;
                            break;
                    }
                }
                switch (option) {
                    case 'Yes':
                        votesYes++;
                        break;
                    case 'Abstention':
                        votesAbstention++;
                        break;
                    case 'No':
                        votesno++;
                        break;
                }
                lastSelectedOptions.set(userId, option);
                interaction.message.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Poll")
                            .setDescription(question)
                            .addFields([
                                { name: "Yes", value: `${voteYes} Stimmen` },
                                { name: "Abstention", value: `${votesAbstention} Stimmen` },
                                { name: "No", value: `${votesNo} Stimmen` },
                            ]),
                    ],
                });
          
                interaction.reply({
                    content: `You voted for the option "${option}"`,
                    ephemeral: true // 
                });
            }
            collector.on('end', () => {
     
                console.log('The survey is closed.');
            });
        } else {
            message.channel.send("The specified time is invalid. Please enter the time in seconds, minutes, hours or days, e.g. `!survey Should the bot be activated? 60s`");
        }
    }
}
function parseTimeInput(input) {
    const timeRegex = /^(\d+)([smhd])$/;
    const match = input.match(timeRegex);
    if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 60 * 60 * 24;
            default:
                return NaN;
        }
    }
    return NaN;
}
function endUmfrage(sentMessage) {
    const roleId1 = '1093589980720410655';  // Replace this with the ID of the first role
    const roleId2 = '917796323921637446'; // Replace this with the ID of the second role
    const role1 = sentMessage.guild.roles.cache.get(roleId1);
    const role2 = sentMessage.guild.roles.cache.get(roleId2);
    if (role1 && role2) {
        sentMessage.channel.send(`The survey is closed. ${role1} ${role2}`);
    } else {
        sentMessage.channel.send("DThe survey is closed!");
    }
    const embed = sentMessage.embeds[0];
    const fields = embed.fields;
    const results = {};
    for (const field of fields) {
        const option = field.name;
        const votes = parseInt(field.value);
        results[option] = votes;
    }
    let winnerVotes = 0;
    for (const [option, votes] of Object.entries(results)) {
        if (votes > winnerVotes) {
            winner = option;
            winnerVotes = votes;
        }
    }

    const resultsEmbed = new EmbedBuilder()
        .setTitle("The survey is closed.")
        .setDescription(`The Poll: "${embed.description}" is closed.\n\n`)
        .addFields(
            { name: "Stimmen für Yes", value: results['Yes'].toString(), inline: true },
            { name: "Stimmen für Abstention", value: results['Abstention'].toString(), inline: true },
            { name: "Stimmen für No", value: results['No'].toString(), inline: true }
        );

    sentMessage.channel.send({ embeds: [resultsEmbed] });
}
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return; // 
    if (message.content.startsWith("!poll")) {
        handleUmfrage(message);
    }
    if (message.content.startsWith('!Donation')) {
        const messageText = '**Your Text';
        const donationInfoEmbed = new EmbedBuilder()
            .setTitle('YourText ')
            .addFields(
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '1 Dollar', value: 'Buy me a Coffee' },
                { name: '', value: '' }
              
            )
            .setColor('#0099ff') //
            .setFooter({ text: 'Thanks for your Donation!' });
        await message.delete();
        await message.channel.send(messageText);
        await message.channel.send({ embeds: [donationInfoEmbed] });
    }
    if (message.content.startsWith('!Rule')) {
        const messageText = '**DiscordRules**';
        const dcembed = new EmbedBuilder()
            .setTitle('**RULES**')
            .setColor('#0000FF')
            .addFields(
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' } // Here you can enter your data accordingly
            )
            .setFooter({ text: 'YourTEXT ' });

        await message.delete();
        await message.channel.send(messageText);
        await message.channel.send({ embeds: [dcembed] });
    }
    if (message.content.startsWith('!Rules')) {
        const serverEmbed = new EmbedBuilder()
            .setTitle('**ServerRules**')
            .setColor('#DE350B')
            .setThumbnail('YourThumbnail')
            .addFields(
                { name: '', value: '' }, // Here you can enter your data accordingly
        { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' } // Here you can enter your data accordingly
            )
            .setFooter({ text: 'Have Fun and good Luck!' });
        const geEmbed = new EmbedBuilder()
            .setTitle('**Your lottery rules**')
            .setColor('#000000')
            .addFields(
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' } // Here you can enter your data accordingly
            )
            .setFooter({ text: 'YourText!' });
        const crEmbed = new EmbedBuilder()
            .setTitle('**CreativeRegeln**')
            .addFields(
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' } // Here you can enter your data accordingly
            )
        await message.delete();
        await message.channel.send({ embeds: [serverEmbed, crEmbed, geEmbed] });
    }

    if (message.content.startsWith('!Commands')) {
        const dcbeEmbed = new EmbedBuilder()
            .setTitle('What commands are available to me?')
            .addFields(
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' } // Here you can enter your data accordingly
            )
            .setColor('#0099ff')  
        await message.delete();
        await message.channel.send({ embeds: [dcbeEmbed] });
    }

    else if (message.content.toLowerCase() === '!play') {
        const playEmbed = new EmbedBuilder()
            .setTitle('Connection instructions')
            .setDescription('')
            .addFields(
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' } // Here you can enter your data accordingly
            )
         .setImage('Your IMAGE')
            .setFooter({ text: 'Thank you very much and have fun on the server!' });
       
        await message.delete();
        await message.channel.send({ embeds: [playEmbed] });
    }
    else if (message.content.toLowerCase() === '!vote') {
        const embed = new EmbedBuilder()
            .setTitle('Vote for the server')
            .setDescription('Here are the links to vote:')
            .addFields(
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' }, // Here you can enter your data accordingly
                { name: '', value: '' } // Here you can enter your data accordingly
            )
            .setFooter({ text: 'YOURTEXT' });
        await message.delete();
        await message.channel.send({ embeds: [embed] });
    }
    if (message.content.startsWith("!update")) {
        updateServerStatus();
    }
    // Please note that this function can be exploited if in the wrong hands!
    if (!message.guild) return; // 
    if (message.author.bot) return; // 
    const args = message.content.slice('!').trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const allowedRoleID = '917413024879509515'; //Replace the ID 
    if (command === '!dm') {
        if (!message.member.roles.cache.has(allowedRoleID)) {
            return message.reply('You are not authorized to use this command..');
        }
        const user = message.mentions.users.first();
        if (!user) return message.reply('Please mention a user to whom you would like to send a DM.');
        const text = args.slice(1).join(' ');
        if (!text) return message.reply('Please enter the text for the DM.');
        try {
            await user.send(text);
            message.reply(`The DM was successfully sent to ${user.tag}.`);
        } catch (error) {
            console.error('An error occurred while sending the DM', error);
            message.reply('An error occurred while sending the DM.');
        }
    }
    if (message.content.startsWith('!start_giveaway')) {
        console.log('!giveaway-Befehl');
        try {
            if (message.member.permissions.has('ADMINISTRATOR') || message.author.id === '682094286623211571') { //Replace the ID!
                const args = message.content.split(' ');
                if (args.length < 6) {
                    message.reply({ content: 'Invalid use! Use: !start_giveaway <time> <prize> [excludedRoles] <winner>', ephemeral: true });
                    return;
                }
                const timeArg = args.slice(1).join(' '); // 
                const prize = args.slice(3, -2).join(' ');
                const numWinnersArg = args[args.length - 1]; // A
                const excludedRolesOption = args[args.length - 2]; // 
                const timeUnitMatch = timeArg.match(/(\d+)\s*(\w+)/);
                if (!timeUnitMatch) {
                    message.reply({ content: 'Invalid time', ephemeral: true });
                    return;
                }
                let timeValue = parseInt(timeUnitMatch[1]); // 
                let timeUnit = timeUnitMatch[2].toLowerCase(); // 
                timeValue = parseInt(timeUnitMatch[1]);
                timeUnit = timeUnitMatch[2].toLowerCase();
        
                if (isNaN(timeValue) || timeValue <= 0) {
                    message.reply({ content: 'Invalid time specification. It must be a positive number', ephemeral: true });
                    return;
                }
      
                const validTimeUnits = ['second', 'seconds', 'minute', 'minutes', 'hour', 'hours', 'day', 'days'];
                if (!validTimeUnits.includes(timeUnit)) {
                    message.reply({ content: 'Invalid time specification!', ephemeral: true });
                    return;
                }
                // Parsen Sie die Anzahl der Gewinner
                numWinners = parseInt(numWinnersArg);
                if (isNaN(numWinners) || numWinners <= 0) {
                    message.reply({ content: 'Invalid number of winners. It must be a positive integer', ephemeral: true });
                    return;
                }
                const timeUnits = {
                    second: 1,
                    seconds: 1,
                    minute: 60,
                    minutes: 60,
                    hour: 3600,
                    hours: 3600,
                    day: 86400,
                    days: 86400
                };
                const timeInSeconds = timeValue * timeUnits[timeUnit];
                const targetChannel = client.channels.cache.get(targetChannelId);
                if (!targetChannel) {
                    message.reply({ content: 'Target channel not found.', ephemeral: true });
                    return;
                }
               
                const allowExcludedRoles = excludedRolesOption.toLowerCase() === 'true';
                const roleMentions = ['1093589980720410655', '917796323921637446']; //REplace the IDS
                if (allowExcludedRoles) {
                    roleMentions.push(...excludedRoles);
                }
                const roleMentionsString = roleMentions.map(roleId => `<@&${roleId}>`).join(' ');
                const announcementText = `Dear ${roleMentionsString}, a new competition has been launched!`;
           
                targetChannel.send(announcementText);
                function getFooterText(allowExcludedRoles) {
                    if (allowExcludedRoles) {
                        return 'This competition is organized by Mystic Celduin.\nThere is no entitlement to a prize payout';
                    } else {
                        return 'This competition is organized by Mystic Celduin.\nThere is no entitlement to a prize payout.\nThe team is excluded from competitions!';
                    }
                }
                const button = new ButtonBuilder()
                    .setLabel('Participate!')
                    .setStyle('Primary')
                    .setCustomId('Participate-button');
                // Erstellen der ActionRow
                const row = new ActionRowBuilder()
                    .addComponents(button);
                const embed = new EmbedBuilder()
                    .setTitle('🎉 Competition 🎉')
                    .setColor('#FFD700')
                    .addFields(
                        { name: 'Action', value: 'Click on the reaction!' },
             { name: 'Price', value: `"${prize}"` },
                        { name: 'Ends in', value: `${timeValue} ${timeUnit}!` },
                        { name: 'Number of winners', value: numWinners.toString() }
                    )
                const footerText = getFooterText(allowExcludedRoles);
                embed.setFooter({ text: footerText });
    
                const giveawayMessage = await targetChannel.send({ embeds: [embed], components: [row] });
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
                message.reply({ content: 'You do not have authorization to start a competition!', ephemeral: true });
            }
        } catch (error) {
            console.error('Error when starting the competition', error);
        }
    }
    if (message.content.startsWith('!end_giveaway')) {
        if (message.member.permissions.has('ADMINISTRATOR') || message.author.id === '682094286623211571') { // Replace the ID
            const giveawayData = Array.from(activeGiveaways.values()).find((data) => {
                return data.channel.id === targetChannelId;
            });
            if (giveawayData) {
       
    endGiveaway(giveawayData.channel.id);
    message.reply({ content: 'The giveaway has ended early!', ephemeral: true });
} else {
    message.reply({ content: 'No active competitions found!', ephemeral: true });
}
    } else {
        message.reply({
            content: 'You dont have permission to end a competition!', ephemeral: true });
    }
}
});
client.on('messageCreate', message => {
    if (!message.author.bot && message.channel.type === 1) {
        console.log(`DM ${message.author.tag} Form: ${message.cleanContent}`);
        message.author.send('Thank you for the information..');
         // Notify another user about the DM
        const otherUser = client.users.cache.get('USER_ID');  // Replace 'USER_ID' with the ID of the user to be notified
        if (otherUser) {
            otherUser.send(`A DM was sent from ${message.author.tag} with the content "${message.cleanContent}".`);
        }
    }
});
async function saveGiveawaysToJson() {
    try {
        const giveawaysArray = Array.from(activeGiveaways);
        const jsonData = JSON.stringify(giveawaysArray, null, 2);

        fs.writeFileSync('giveaways.json', jsonData, 'utf-8');
        console.log('Contest information successfully saved in giveaways.json');
    } catch (error) {
        console.error('Error when saving the raffle information in giveaways.json', error);
    }
}
function endGiveaway(messageId, numWinners) {
    const giveawayData = activeGiveaways.get(messageId);
    if (giveawayData) {
        console.log('Participants:', giveawayData.participants); // Debug-Ausgabe
        const channel = giveawayData.channel;
        if (giveawayData.participants.length > 0) {
            const uniqueParticipants = Array.from(new Set(giveawayData.participants)); // 
            if (uniqueParticipants.length > 0) {
                const winners = [];
                for (let i = 0; i < numWinners; i++) {
                    const winnerId = uniqueParticipants[Math.floor(Math.random() * uniqueParticipants.length)];
                    const winner = channel.guild.members.cache.get(winnerId);
                    if (winner) {
                        winners.push(winner);

                        uniqueParticipants.splice(uniqueParticipants.indexOf(winnerId), 1);
                    }
                }
                if (winners.length > 0) {
                    const winnerNames = winners.map(winner => winner.toString()).join(', ');
                    channel.send(` Die Gewinner von "${giveawayData.prize}" sind: ${winnerNames}! `);
                    // Nachricht entfernen
                    channel.messages.fetch(messageId)
                        .then(giveawayMessage => {
                            if (giveawayMessage) {
                                giveawayMessage.reactions.removeAll().catch(error => console.error('Error when removing the reactions', error));
                            } else {
                                console.error('Active competition message not found.');
                            }
                        })
                        .catch(error => console.error('Error when retrieving the competition message', error));
                } else {
                    channel.send(` Nobody has entered the competition for "${giveawayData.prize}" yet. `);
                    // Nachricht entfernen
                    channel.messages.fetch(messageId)
                        .then(giveawayMessage => {
                            if (giveawayMessage) {
                                giveawayMessage.reactions.removeAll().catch(error => console.error('Error when removing the reactions:', error));
                            } else {
                                console.error('Active competition message not found.');
                            }
                        })
                        .catch(error => console.error('Error retrieving the competition message', error));
                }
            } else {
                console.log("No participants found.");
                channel.send(` Nobody has entered the competition for "${giveawayData.prize}" yet. `);
                // Nachricht entfernen
                channel.messages.fetch(messageId)
                    .then(giveawayMessage => {
                        if (giveawayMessage) {
                            giveawayMessage.reactions.removeAll().catch(error => console.error('Error when removing the reactions', error));
                        } else {
                            console.error('Active competition message not found.');
                        }
                    })
                    .catch(error => console.error('Error retrieving the competition message', error));
            }
        }

        activeGiveaways.delete(messageId);
    }
}
// Function for the server status
async function getServerStatus() {
    const serverAddress = 'xxx.xx.xx.xx:xxxx'; // Replace this with your server IP!
    const StatusUrl = `https://api.mcsrvstat.us/3/${serverAddress}`;
    try {
        const response = await axios.get(StatusUrl);
        const Status = response.data;
        return Status;
    } catch (error) {
        console.error('Error when querying the Java server status', error);
        return null;
    }
}
 
        let StatusMessage = null;
     
        let savedStatus = {};
        try {
            savedStatus = JSON.parse(fs.readFileSync('Status.json', 'utf8'));
        } catch (error) {
            console.error('Fehler beim Laden der gespeicherten Status:', error);
        }
    async function updateServerStatus() {
        const commonChannelId = '1178055581953687612'; //Shared channel  Replace the number with your channel ID
        const commonChannel = client.channels.cache.get(commonChannelId);
        if (!commonChannel) {
            console.error('The specified shared channel was not found.');
            return; // 
        }
        const Status = await getServerStatus();
    
      
        StatusMessage = await sendOrUpdateEmbed(commonChannel, StatusEmbed('Status', Statusstatus), savedStatus.StatusMessage);

        
        savedStatus.StatusMessage = StatusMessage ? StatusMessage.id : null;
 
        saveStatusToFile(savedStatus);
    }
    async function sendOrUpdateEmbed(channel, embed, messageId) {
        try {
            if (messageId) {
            
                const previousMessage = await channel.messages.fetch(messageId);
                await previousMessage.edit({ embeds: [embed] });
                return previousMessage;
            } else {
     
                const newMessage = await channel.send({ embeds: [embed] });
                return newMessage;
            }
        } catch (error) {
            console.error('Fehler beim Senden oder Aktualisieren des Embeds:', error);
            return null;
        }
    }

    function saveStatusToFile(status) {
        fs.writeFileSync('Status.json', JSON.stringify(status, null, 2), 'utf8');
    }
function StatusEmbed(title, serverStatus) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(serverStatus.online ? '#FF7F00' : '#FF0000'); 
    if (serverStatus.online) {
        const playersOnline = serverStatus.players.online;
        const maxPlayers = serverStatus.players.max;
        const version = serverStatus.version || '1.19-1.20.4'; 
        const serverName = 'Your ServerName';
        const serverAdresse = 'Your Login IP'
        embed.addFields(
            { name: 'Server Status', value: 'Online' },
            { name: 'Player', value: `${playersOnline}/${maxPlayers}` },
            { name: 'Serveradresse', value: serverAdresse },
            { name: 'ServerName', value: serverName },
            { name: 'Version', value: version }
         
        );
        embed.setTimestamp();
    } else {
        embed.addFields({ name: 'Server Status', value: 'Offline' });
    }
    return embed;
}
function createWelcomeEmbed(memberTag, member) {
   
    if (!member || !member.user) {
        console.error('Invalid member or user object.');
        return null;  // 
    }
    const welcomeEmbed = new EmbedBuilder()
        .setTitle('Welcome to the server!')
        .setColor('#00ff00')
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: 'Your Text' }); 
    welcomeEmbed.addFields([
        { name: '', value: '' }, // Here you can enter your data accordingly
        { name: '', value: '' }, // Here you can enter your data accordingly
        { name: '', value: '' } // Here you can enter your data accordingly
    ]);
welcomeEmbed.setTimestamp();
    return welcomeEmbed;
}
function createGoodbyeEmbed(memberTag, member) {
    const goodbyeEmbed = new EmbedBuilder()
        .setTitle('GoodBye!')
        .setColor('#ff0000')
        .setDescription(`Goodbye ${member.displayName}`)
        .setFooter({ text: 'Your Text' }) // 
        .addFields([
            { name: '', value: '' }, // Here you can enter your data accordingly
            { name: '', value: '' }, // Here you can enter your data accordingly
            { name: '', value: '' }, // Here you can enter your data accordingly
        ]);
    if (member.user && member.displayAvatarURL) {
        goodbyeEmbed.setThumbnail(member.displayAvatarURL({ dynamic: true }));
    } else {
        goodbyeEmbed.setThumbnail('https://discord.com/assets/6debd47ed13483642cf09e832ed0bc1b.png'); // Standard-Avatar-URL
    }
goodbyeEmbed.setTimestamp();
    return goodbyeEmbed;
}
client.login(TOKEN);
