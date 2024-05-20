const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mcinfo')
        .setDescription('Shows general information for XX Server.') // Replaced XX
        .addSubcommand(subcommand => subcommand.setName('commands').setDescription('Shows general commands for the server.'))
        .addSubcommand(subcommand => subcommand.setName('map').setDescription('Shows the map of the XX network.')) // Replaced XX
        .addSubcommand(subcommand => subcommand.setName('vote').setDescription('Shows links to vote for the server.'))
        .addSubcommand(subcommand => subcommand.setName('ban').setDescription('Shows information about bans.'))
        .addSubcommand(subcommand => subcommand.setName('link').setDescription('Shows information about account linking.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages), // Optional

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'commands') {
            const beEmbed = new EmbedBuilder()
                .setTitle('General Commands on XX Server') // Replaced  XX
                .setColor('#0099ff')
                .addFields(
                    { name: 'xx', value: 'yy' }, //Please replace xx with the command names and yy with the descriptions, 
                    //like so: { name: '/kit newbie', value: 'Get a starter kit.'  Feel free to customize the name and value pairs according to your specific commands and descriptions.
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' },
                    { name: 'xx', value: 'yy' }
                
                )
                .setFooter({ text: 'Have fun on the XX Server!' }); // Replaced XX

            await interaction.reply({ embeds: [beEmbed] });
        } else if (subcommand === 'map') {
            const mapEmbed = new EmbedBuilder()
                .setTitle('XX Map') // Replaced Mystic with XX
                .setDescription('Here is the map of the XX network:') // ReplacedXX
                .setImage('MAP_IMAGE_URL') // Placeholder for map image URL
                .addFields(
                    { name: 'Map Link', value: '[Link](MAP_LINK_URL)', inline: false } // Placeholder for map link
                )
                .setFooter({ text: 'We wish you a lot of fun on XX!' }); // Replaced XX

            await interaction.reply({ embeds: [mapEmbed] });
        } else if (subcommand === 'vote') {
            const voteEmbed = new EmbedBuilder()
                .setTitle('Vote for the Server')
                .setDescription('Here are the links to vote:')
                .addFields(
                    { name: 'MC Server List', value: '[Link](VOTE_LINK_1)', inline: false }, // Placeholder for vote link 1
                    { name: 'Minecraft Server EU', value: '[Link](VOTE_LINK_2)', inline: false }, // Placeholder for vote link 2
                    { name: 'Minecraft Server List', value: '[Link](VOTE_LINK_3)', inline: false }, // Placeholder for vote link 3
                    { name: 'Minecraft-MP', value: '[Link](VOTE_LINK_4)', inline: false }, // Placeholder for vote link 4
                    { name: 'Planet Minecraft (No Bedrock Support)', value: '[Link](VOTE_LINK_5)', inline: false } // Placeholder for vote link 5
                )
                .setFooter({ text: 'You will receive 950 MCT + a surprise for your vote!' });

            await interaction.reply({ embeds: [voteEmbed] });
        } else if (subcommand === 'ban') {
            const bEmbed = new EmbedBuilder()
                .setTitle('Ban Information')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Bans', value: 'You can find all bans at [XXBans](BAN_LIST_URL)' } // Replaced XXBans and added placeholder
                );

            await interaction.reply({ embeds: [bEmbed] });
        } else if (subcommand === 'link') {
            const linkungEmbed = new EmbedBuilder()
                .setTitle('Account Linking')
                .setColor('#0099ff')
                .addFields(
                    { name: 'Account Linking', value: 'If you play both Java and Bedrock Edition, please link your accounts via [Geyser](https://link.geysermc.org/) to avoid playing with two accounts!\n**Please do not translate the page, as it will not work properly otherwise**' }
                );

            await interaction.reply({ embeds: [linkungEmbed] });
        }
    }
};
