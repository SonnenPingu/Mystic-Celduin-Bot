const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
//Placeholders:

//YOUR_GAMERTAG: Replace with your actual gamertag.
//  IMAGE_URL_BEDROCK: Replace with the URL of the image for Bedrock instructions.
//    YOUR_SERVER_NAME: Replace with the name of your server.
//      YOUR_SERVER_ADDRESS: Replace with the address of your server.
//        YOUR_SERVER_PORT: Replace with the port of your server.
//          IMAGE_URL_PC_MOBILE: Replace with the URL of the image for PC / mobile instructions.
module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Instructions for connecting to the Minecraft server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages) // Optional
        .addSubcommand(subcommand =>
            subcommand
                .setName('bedrock')
                .setDescription('Instructions for Bedrock Edition (consoles, mobile)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pc-mobile')
                .setDescription('Instructions for Windows, MacOS, Android, iOS')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('java')
                .setDescription('Instructions for Java Edition')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'bedrock') {
            const bedrockEmbed = new EmbedBuilder()
                .setTitle('Instructions for Connecting with Bedrock Edition')
                .setDescription('Here are brief instructions on how to connect to the Minecraft server using Bedrock Edition!')
                .addFields(
                    { name: 'Step 1: Start Minecraft', value: 'Launch Minecraft and go to the Friends tab.' },
                    { name: 'Step 2: Add Friend', value: 'Click "Add Friend" and search for the gamertag `YOUR_GAMERTAG`' }, // Placeholder
                    { name: 'Can\'t find the user?', value: 'Some users may not be able to find my account. In this case, please download the Xbox app on your phone and search for the friend there. Use the same login credentials as on your console.' }
                )
                .setImage('IMAGE_URL_BEDROCK') // Placeholder for Bedrock image URL
                .setFooter({ text: 'Thank you and have fun on the server!' });

            await interaction.reply({ embeds: [bedrockEmbed] });
        } else if (subcommand === 'pc-mobile') {
            const windowsEmbed = new EmbedBuilder()
                .setTitle('Instructions for Connecting with Windows, MacOS, or Mobile')
                .setDescription('Here are brief instructions on how to connect to the Minecraft server using PCs or mobile devices!')
                .addFields(
                    { name: 'Step 1: Start Minecraft', value: 'Launch Minecraft and go to the Servers tab.' },
                    { name: 'Step 2: Add Server', value: 'Scroll down and click "Add Server".' },
                    { name: 'Step 3: Enter Details', value: 'Enter the following details:\nServer Name: `YOUR_SERVER_NAME`\nServer Address: `YOUR_SERVER_ADDRESS`\nPort: `YOUR_SERVER_PORT`' }
                )
                .setImage('IMAGE_URL_PC_MOBILE') // Placeholder for PC/Mobile image URL
                .setFooter({ text: 'Thank you and have fun on the server!' });

            await interaction.reply({ embeds: [windowsEmbed] });
        } else if (subcommand === 'java') {
            const javaEmbed = new EmbedBuilder()
                .setTitle('Instructions for Connecting with Java Edition')
                .setDescription('Java players can use the server address `YOUR_SERVER_ADDRESS` to connect to the server.')
                .setFooter({ text: 'Thank you and have fun on the server!' });

            await interaction.reply({ embeds: [javaEmbed] });
        }
    }
};
