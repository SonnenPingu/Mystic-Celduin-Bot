const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { activeGiveaways, startGiveaway, endGiveaway, saveGiveawaysToJson, loadGiveawaysFromJson } = require('../functions/giveaways');

function parseTimeInput(input) {
    // Check if the input is a valid time format
    const timeUnitMatch = input.match(/(\d+)\s*(\w+)/);
    if (!timeUnitMatch) {
        throw new Error('Invalid time format!');
    }

    // Extract the time value and unit from the input
    const timeValue = parseInt(timeUnitMatch[1]);
    const timeUnit = timeUnitMatch[2].toLowerCase();

    // Convert the time input to seconds
    const timeUnits = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400
    };

    if (!timeUnits.hasOwnProperty(timeUnit)) {
        throw new Error('Invalid time unit!');
    }

    return timeValue * timeUnits[timeUnit];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Start a giveaway')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Duration of the giveaway (e.g. 1h, 30m, 2d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('prize')
                .setDescription('The prize of the giveaway')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('number_of_winners')
                .setDescription('Number of winners')
                .setRequired(true)
        ),
    async execute(interaction) {
        const timeArg = interaction.options.getString('time');
        const prize = interaction.options.getString('prize');
        const numWinners = interaction.options.getInteger('number_of_winners');

        try {
            const timeInSeconds = parseTimeInput(timeArg);
            await startGiveaway(interaction, timeInSeconds, prize, numWinners);

            // End the giveaway after the specified time
            setTimeout(async () => {
                await endGiveaway(interaction, numWinners);
            }, timeInSeconds * 1000);
        } catch (error) {
            console.error('Error starting giveaway:', error);
            await interaction.reply({ content: 'An error occurred while starting the giveaway.', ephemeral: true });
        }
    }
};
