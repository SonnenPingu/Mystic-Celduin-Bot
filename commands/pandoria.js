const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pandoria')
        .setDescription('Displays rules, tips, commands, and post system info for Mystic Pandoria.')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages), // Optional: Allow all to send

    async execute(interaction) {
        const logoUrl = 'https://example.com/placeholder.png'; // Placeholder for logo URL

        const ruleEmbed = new EmbedBuilder()
            .setTitle('Rules for Mystic Pandoria')
            .setColor('#0000FF')
            .setThumbnail(logoUrl) // Add the logo thumbnail
            .addFields(
                { name: 'General Rules', value: 'All rules from the Mystic Celduin server also apply to Pandoria.' },
                { name: 'Specific Rules for Pandoria', value: '• All types of farms are prohibited; this is a medieval server, and farms did not exist in that era!\n• City and nation names must not be illegal, obscene, or otherwise inappropriate. Violations will lead to deletion and server exclusion.\n• The rules on the website take precedence: [Placeholder URL]' }
            );

        const tipsEmbed = new EmbedBuilder()
            .setTitle('Tips')
            .setColor('#FF0000')
            .setThumbnail(logoUrl) // Add the logo thumbnail
            .addFields(
                { name: 'Thirst and Armor', value: '• Keep an eye on your thirst! Drink enough water!\n• Armor can affect your movement speed.' },
                { name: 'Building in the Wilderness', value: 'Be careful when building in the wilderness! The world is refreshed every 24 hours and buildings in the wilderness will be destroyed.' },
                { name: 'City Size', value: '• Initially, you have 8 plots.\n• With a nation, you get 10 additional plots.\n• Each resident gives you 10 more plots (maximum 28).\n• Build cities, not castles (at least not at the beginning).' },
                { name: 'Titles', value: '• You start as nomads and become peasants by founding a city.\n• By developing your city, you can reach higher titles (up to king).\n• Titles unlock features and enable city expansions.\n• The title display is currently not working.' }
            );

        const commandEmbed = new EmbedBuilder()
            .setTitle('Commands')
            .setColor('#FFFFFF')
            .setThumbnail(logoUrl) // Add the logo thumbnail
            .addFields(
                { name: '/t create [Name]', value: 'Creates a city.' },
                { name: '/t deposit [Amount]', value: 'Deposits money into your city.' },
                { name: '/t claim', value: 'Expands your city by a 16x16 area.' },
                { name: '/t claim outpost', value: 'Creates an outpost (1500 MysticTalers, protects valuable areas).' },
                { name: '/t unclaim', value: 'Reduces your city size.' },
                { name: '/t delete', value: 'Deletes your city permanently.' },
                { name: '/t spawn', value: 'Teleports you to your city (or to other cities for a fee).' },
                { name: '/t invite [Name]', value: 'Invites a player to your city (resident or friend).' },
                { name: '/plot set <Type>', value: 'Marks an area as Farm, Inn, Default, or Jail.' },
                { name: '/plot fs [Amount]', value: 'Offers plots for sale.' },
                { name: '/tm', value: 'Opens the town management menu.' },
                { name: '/nation new [Name]', value: 'Creates a nation (1500 MysticTalers).' },
                { name: '/n deposit [Amount]', value: 'Deposits money into your nation.' },
                { name: 'More Info', value: '[Towny Commands](https://github.com/TownyAdvanced/Towny/wiki/Towny-Commands)' }
            );

        const postEmbed = new EmbedBuilder()
            .setTitle('Post System')
            .setColor('#0099ff') // You can customize the color
            .setThumbnail(logoUrl) // Add the logo thumbnail
            .addFields(
                { name: 'Rulebook and Command Book', value: 'Use the command `/getbook Pandoria` to get the rulebook and `/getbook Pan` to get the command book.' },
                { name: 'Post System', value: 'Pandoria has a post system for fun.' },
                { name: 'Writing a Letter', value: 'Use `/letter [Text]` to write your letter.' },
                { name: 'Sending a Letter', value: 'Use `/post [Username]` with the letter book in hand to send it. Note that delivery may sometimes fail if the recipient cannot be reached by the postman.' },
                { name: 'Commands on the Website', value: 'For easy reference, you can find the [commands](https://example.com/placeholder) on the website.' }
            );

        const mapEmbed = new EmbedBuilder()
            .setTitle('In-game Map')
            .setColor('#FF8C00')
            .setThumbnail(logoUrl)
            .addFields(
                { name: 'The Simple In-game Map', value: 'Use the command `/towny map hud` to get a "round dimension" map that updates almost in real-time.' },
                { name: 'Symbols', value: 'You are identified by the orange symbols, indicating your current position.' },
                { name: 'Different Symbols', value: '• H: Home point of a city\n• F: Farms\n• I: Inns (Hotels)' },
                { name: 'Different Symbols 2', value: '• J: Jail\n• -: Wilderness\n• +: City area\n• $: For sale area' },
                { name: 'Different Symbols 3', value: '• O: Outpost\n• Additional symbols are not relevant for our purposes yet.' }
            );

        await interaction.reply({
            content: '**These are the rules and commands for the Mystic Pandoria server!**',
            embeds: [ruleEmbed, tipsEmbed, commandEmbed, postEmbed, mapEmbed]
        });
    }
};
