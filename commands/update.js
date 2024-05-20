const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const serverStatus = require('../functions/serverstatus');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Aktualisiere den Serverstatus.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            await serverStatus.updateServerStatus(interaction.client); // Verwende das importierte Modul
            await interaction.editReply({ content: 'Serverstatus wurde aktualisiert.', ephemeral: true });
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Serverstatus:', error);
            await interaction.editReply({ content: 'Fehler beim Aktualisieren des Serverstatus.', ephemeral: true });
        }
    }
};
