const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Displays the rules of the xx server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const serverEmbed = new EmbedBuilder()
            .setTitle('Server Rules')
            .setColor('#DE350B')
            .setThumbnail('https://example.com/placeholder.png') // Placeholder for thumbnail
            .addFields(
                { name: 'General Rules', value: '• Respect other players.\n• Avoid spam and advertising.\n• PvP is not allowed.\n• Alt accounts are prohibited.\n• New players inactive for more than 5 days will be reset.\n• Deaths due to random teleport are your own responsibility, and the server operator is not liable.' },
                { name: 'Chat Rules', value: '• Insults are prohibited.\n• Spam and caps lock are forbidden.\n• Offensive words are not allowed.' },
                { name: 'Building Rules', value: '• Do not build obscene, misanthropic, or racist structures.\n• Do not build 1x1 towers.\n• Do not build end portals.\n• Inactive regions can be deleted. Max 7 days without notice! (Logging in for a few minutes does not count)' },
                { name: 'Cheating Rules', value: '• X-Ray, fly, auto-build, auto-clicker, world downloader, and other mods are forbidden.\n• Report bugs instead of exploiting them.' },
                { name: 'Server Load Structures', value: '• Be economical with entities and tile entities. (Items will be deleted at 50, mobs at 75.)\n• Mass animal farming and automatic farms are prohibited.\n• Monster farms are prohibited.\n• Farms should be built underground if possible.\n• XP/Raid farms are not allowed.\n• Spawner farms can only be built from naturally occurring spawners.' },
                { name: 'Trade and Currency', value: '• Each player can acquire 2 shops; more can be requested.\n• Shops can sell anything except items from the admin shop.\n• Inactive shops will be deleted.\n• The only valid currency is MysticCelduinTaler (MCT).\n• Shops of logged-off players will be closed!' },
                { name: 'Rule Violations', value: '• Violations can lead to a permanent ban from the server.\n• Rule changes will be published without notice.\n• In case of doubt, the rules on the website apply: [Placeholder URL]' }
            )
            .setFooter({ text: 'Have fun on the xx server!' });

        const geEmbed = new EmbedBuilder()
            .setTitle('Giveaway Rules')
            .setColor('#000000')
            .addFields(
                { name: 'Claiming Prizes', value: 'There is no guarantee for the execution of prizes.' },
                { name: 'Personal Data', value: 'Certain giveaways require your personal address data. This data is collected and processed in accordance with GDPR and then properly deleted.' },
                { name: 'Funding', value: 'Certain giveaways are funded by [Placeholder Link]' }
            )
            .setFooter({ text: 'Good luck with the giveaways!' });

        const crEmbed = new EmbedBuilder()
            .setTitle('Additional Rules')
            .addFields(
                { name: 'Community Building', value: 'If you decide to add users to your build area and they steal or destroy something, you are responsible!' },
                { name: 'Stations', value: 'Each player should expand their station so the railway can be used to visit the respective build site!' },
                { name: 'Shop', value: 'Shop prices must be realistic. Signs like B 10 and 0 S or B 10 and 1 S or just B 10 are not realistic! Such shops will be immediately deleted, and a penalty fee of 2K will be deducted! If you only want to sell, all your signs must be adjusted accordingly, otherwise, the above rule applies!' },
                { name: 'Farms', value: 'Available farms include iron, wool, gunpowder, bonemeal, and more at `/farm` or via the sign at the mall!' },
                { name: 'Farms 2', value: 'Maximum withdrawal per day is 2 stacks, except for the wool farm where it is 1 stack per day! All plants must be replanted! Violating this will result in a ban from the area. If you give material to a banned player, you will also be banned!' }
            );

        await interaction.reply({ embeds: [serverEmbed, crEmbed, geEmbed] });
    }
};
