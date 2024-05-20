const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
///Make sure to replace placeholder-link with the actual link when you have it.
module.exports = {
    data: new SlashCommandBuilder()
        .setName('dcrules')
        .setDescription('Displays the rules of the Mystic Celduin Discord server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages), // Optional: Allow all to send

    async execute(interaction) {
        const dcembed = new EmbedBuilder()
            .setTitle('Rules for xxx')
            .setColor('#0000FF')
            .addFields(
                {
                    name: 'Code of Conduct',
                    value: '• Respectful Behavior: We respect everyone here, regardless of appearance or origin. Be friendly and respectful to each other!\n\n• No Negativity: 😕 Negativity and discrimination are not welcome here.\n\n• Prohibited Content: ⛔️ NSFW & political content, insults, spam, and illegal activities are forbidden.'
                },
                {
                    name: 'Profile',
                    value: '• Readable Name: Your username must be readable.\n\n• No Special Characters: ⁉️ Hoisting through special characters is not allowed.\n\n• Appropriate Content: 🖼️ Profile pictures and usernames must not contain insults, provocations, pornographic, or racist content.'
                },
                { name: 'Leaks', value: 'Sharing private data is prohibited.' },
                { name: 'Advertising', value: 'Advertising other Discord servers, even in private messages, is forbidden.' },
                { name: 'Voice Chat', value: 'The same rules apply as in the text chat.' },
                {
                    name: 'Moderation',
                    value: '• Follow Instructions: 🫡 Follow the instructions of the moderators without contradiction.\n• Direct messages to moderators are only allowed upon request.'
                },
                {
                    name: 'New Users',
                    value: '• Unknown Role: 👤 New users who are not active within the first 5 days will receive the Unknown role.'
                },
                { name: 'For Questions or Problems', value: 'please use the 🆘 [Support Channel](placeholder-link).' },
                {
                    name: 'Discord’s Rules also apply!',
                    value: '➡️ [Discord Community Guidelines](https://discord.com/guidelines)\n➡️ [Terms of Service](https://discord.com/terms)'
                }
            )
            .setFooter({ text: 'Please follow the rules to ensure a pleasant coexistence!' });

        await interaction.reply({ content: '**These are the rules for the xxxx Discord server!**', embeds: [dcembed] });
    }
};
