const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('social')
        .setDescription('Displays the social media links of ´xxxx and streamers.')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages), // Optional: Allow everyone to send messages

    async execute(interaction) {
        const socialEmbed = new EmbedBuilder()
            .setTitle('The social media links of xxx and users who stream for the server!')
            .addFields(
                { name: 'Facebook:', value: 'https://www.facebook.com/PLACEHOLDER' },
                { name: 'TikTok:', value: 'https://www.tiktok.com/@PLACEHOLDER' },
                { name: 'YouTube:', value: 'https://www.youtube.com/channel/PLACEHOLDER' },
                { name: 'Instagram:', value: 'https://www.instagram.com/PLACEHOLDER/' },
                { name: 'Streamer:', value: 'https://www.twitch.tv/PLACEHOLDER' },
                { name: 'Streamer:', value: 'https://www.twitch.tv/PLACEHOLDER' },
                { name: 'Streamer:', value: 'https://www.twitch.tv/PLACEHOLDER' }
            )
            .setFooter({ text: 'We would appreciate it if you follow us everywhere :)' });

        await interaction.reply({ embeds: [socialEmbed] });
    }
};
