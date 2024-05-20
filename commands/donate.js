const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donate')
        .setDescription('Displays information on donations.')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages), 
    async execute(interaction) {
        const donationInfoEmbed = new EmbedBuilder()
            .setTitle('Support Mystic Celduin!')
            .setDescription('Click on the titles to go to the store!')
            .addFields({name: 'xxx', value: 'xxx'}
            )
            .setColor('#0099ff')
            .setFooter({ text: 'Thank you for your support\n The xxx team' });
        const paypalEmbed = new EmbedBuilder()
            .setTitle('PayPal Donate!')
            .addFields(
                { name: 'PayPal', value: 'Voluntary payment via PayPal without any corresponding service! Different amounts are possible for this.' },
                { name: 'Email', value: 'Please use the email: `xxx@xxx` for the payment!' },
                { name: 'Send as:', value: 'Please send as Goods and Services, as it is a business account!' },
                { name: 'Message', value: 'As an additional message, please include: "Support xxx" to ensure it is correctly recorded!' },
                { name: 'Service', value: 'It is not intended that payments via PayPal include any service in the form of pendants, cards, or items from the store, as there are no shipping costs. If you wish for such items, please send your address to the bot and I will let you know the extra amount to transfer.' }
            )
            .setColor('#0099ff');

        const messageText = '**Please send a message to the bot with the amount once you have made a donation. The bot will reply with "Thank you for the information".**';


        await interaction.reply({ content: messageText, embeds: [donationInfoEmbed, paypalEmbed] });
    }
};
