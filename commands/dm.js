const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Sends a direct message to a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) // Requires the "Manage Server" permission
        .addUserOption(option => option.setName('user').setDescription('The user to send the DM to.').setRequired(true))
        .addStringOption(option => option.setName('message').setDescription('The content of the direct message.').setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const messageContent = interaction.options.getString('message');

        try {
            await user.send(messageContent);
            await interaction.reply({ content: `DM sent successfully to ${user.tag}.`, ephemeral: true }); // Ephemeral so only the command user sees it
        } catch (error) {
            console.error('Error sending DM:', error);

            if (error.code === 50007) { // Cannot send messages to this user
                await interaction.reply({ content: 'I cannot send DMs to this user. Have they disabled DMs from server members?', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error sending the DM.', ephemeral: true });
            }
        }
    }
};
