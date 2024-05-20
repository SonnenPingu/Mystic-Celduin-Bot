
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Start a poll.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only administrators can use this command by default
        .addStringOption(option => option.setName('question').setDescription('What do you want to ask?').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('How long should the poll last? (e.g., 1h, 30m, 2d).').setRequired(true))
        .addRoleOption(option => option.setName('role1').setDescription('Which role do you want to mention?').setRequired(false))
        .addRoleOption(option => option.setName('role2').setDescription('Which other role do you want to mention?').setRequired(false)),

    async execute(interaction) {
        // Check if the user has administrator permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const question = interaction.options.getString('question');
        const durationInput = interaction.options.getString('duration');
        const role1 = interaction.options.getRole('role1');
        const role2 = interaction.options.getRole('role2');

        const durationInSeconds = parseTimeInput(durationInput);
        if (!durationInSeconds) {
            return interaction.reply({ content: 'Invalid duration format. Use e.g., 1h, 30m, or 2d.', ephemeral: true });
        }

        await interaction.reply({ content: `A poll: "${question}" for ${ durationInput }.` });

        await startPoll(interaction, question, durationInSeconds, role1, role2);
    }
};

async function startPoll(interaction, question, durationInSeconds, role1, role2) {
    const votes = { yes: 0, abstain: 0, no: 0 };
    const userVotes = new Map(); // Store the current vote of each user

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setLabel('Yes').setStyle('Primary').setCustomId('yes'),
            new ButtonBuilder().setLabel('Abstain').setStyle('Secondary').setCustomId('abstain'),
            new ButtonBuilder().setLabel('No').setStyle('Secondary').setCustomId('no')
        );

    const pollEmbed = new EmbedBuilder()
        .setTitle("Poll")
        .setDescription(question)
        .addFields(
            { name: "Yes", value: `${ votes.yes } votes` },
            { name: "Abstain", value: `${ votes.abstain } votes` },
            { name: "No", value: `${ votes.no } votes` }
        );

    const sentMessage = await interaction.channel.send({
        content: `Hello ${ role1 ? role1 : '' } ${ role2 ? role2 : '' }, a poll with the question: "${question}" has been started!`,
        embeds: [pollEmbed],
        components: [actionRow]
    });

    const collector = sentMessage.createMessageComponentCollector({
        filter: i => i.isButton(),
        time: durationInSeconds * 1000
    });

    collector.on('collect', async i => {
        await updateVote(i, userVotes, votes, question, sentMessage);
    });

    collector.on('end', async () => {
        await endPoll(sentMessage, question, votes, role1, role2);
    });
}

async function updateVote(interaction, userVotes, votes, question, sentMessage) {
    const userId = interaction.user.id;
    const option = interaction.customId;
    const previousVote = userVotes.get(userId);

    if (previousVote) {
        votes[previousVote]--;
    }

    votes[option]++;
    userVotes.set(userId, option);

    const updatedEmbed = new EmbedBuilder()
        .setTitle("Poll")
        .setDescription(question)
        .addFields(
            { name: "Yes", value: `${ votes.yes } votes` },
            { name: "Abstain", value: `${ votes.abstain } votes` },
            { name: "No", value: `${ votes.no } votes` }
        );

    await sentMessage.edit({ embeds: [updatedEmbed] });

    await interaction.reply({
        content: previousVote
            ? `You have changed your vote to "${option}".`
            : `You have voted for "${option}".`,
        ephemeral: true
    });
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
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                return NaN;
        }
    }
    return NaN;
}

async function endPoll(sentMessage, question, votes, role1, role2) {
    const resultsEmbed = new EmbedBuilder()
        .setTitle("Poll Ended")
        .setDescription(`The poll with the question: "${question}" has ended.\n\n`)
        .addFields(
            { name: "Yes votes", value: `${ votes.yes } `, inline: true },
            { name: "Abstain votes", value: `${ votes.abstain } `, inline: true },
            { name: "No votes", value: `${ votes.no } `, inline: true }
        );

    await sentMessage.edit({ content: `The poll has ended! ${ role1 ? role1 : '' } ${ role2 ? role2 : '' } `, embeds: [resultsEmbed], components: [] });
}