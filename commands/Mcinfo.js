
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mcinfo')
        .setDescription('Zeigt allgemeine Informationen für Mystic Celduin an.')
        .addSubcommand(subcommand => subcommand.setName('befehle').setDescription('Zeigt allgemeine Befehle für den Server an.'))
        .addSubcommand(subcommand => subcommand.setName('map').setDescription('Zeigt die Karte des Mystic Netzwerks an.'))
        .addSubcommand(subcommand => subcommand.setName('vote').setDescription('Zeigt die Links zum Voten für den Server an.'))
        .addSubcommand(subcommand => subcommand.setName('ban').setDescription('Zeigt Informationen zu Bans an.'))
        .addSubcommand(subcommand => subcommand.setName('linkung').setDescription('Zeigt Informationen zur Account-Verlinkung an.')) // New subcommand
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages), // Optional


    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'befehle') {
            const beEmbed = new EmbedBuilder()
                .setTitle('Allgemeine Befehle auf Mystic Celduin')
                .setColor('#0099ff')
                .addFields(
                { name: '/kit newbie', value: 'Erhalte ein Einsteiger-Paket.' },
                { name: '/sethome [Name]', value: 'Setze einen zusätzlichen Homepunkt.\n`/removehome [Name]` löscht ihn wieder.\n`/home` zeigt eine Übersicht.' },
                { name: '/tpa [Name]', value: 'Frage an, ob du dich zu einem Spieler teleportieren darfst.\n`/tpa accept` bestätigt die Anfrage.' },
                { name: '/warp', value: 'Nutze verschiedene Warps.' },
                { name: '/msg [Name]', value: 'Sende private Nachrichten an andere Spieler.' },
                { name: '/rg addmember BauplatzXX [Name]', value: 'Erlaube einem Spieler, auf deinem Bauplatz zu helfen.\n`/rg removemember BauplatzXX [Name]` entfernt die Rechte wieder.' },
                { name: '/server <Servername>', value: 'Wechsle zwischen den Servern (Mystic, Pandoria, Drachenpforte).\nBeachte das Ressourcenpaket auf Pandoria!' },
                { name: '/regeln', value: 'Zeige die Serverregeln an.' },
                { name: '/ping', value: 'Überprüfe deinen Ping zum Server.' },
                { name: '/dispose', value: 'Öffne ein Menü zum schnellen Entsorgen von Gegenständen.' },
                { name: '/back', value: 'Kehre zum Ort deines letzten Todes zurück (außer bei Lava- oder Void-Toden).' },
                { name: '/balance', value: 'Zeige deinen Kontostand an.' },
                { name: '/weather sun', value: 'Ändere das Wetter zu Sonne (gilt für alle Spieler).' },
                { name: '/drachen', value: 'Teleportiere dich zum Drachenpforte-Server.' },
                { name: '/pandoria', value: 'Teleportiere dich zum Pandoria-Server.' },
                { name: '/mystic', value: 'Teleportiere dich zurück zum Haupt-Server (nur von anderen Servern aus).' },
                { name: '/test', value: 'Gehe zum Test-Server (falls aktiv, meist mit der neuesten Version).' },
                { name: '/farmen', value: 'Gehe zur Farmwelt (nur auf Mystic).' },
                { name: '/spawn', value: 'Kehre zum Hauptspawn zurück (nur auf Mystic).' },
                { name: '/farm', value: 'Gehe zum Farm-Bereich (nur auf Mystic).' }
            )
                .setFooter({ text: 'Viel Spaß auf dem Mystic Celduin Server!' });

            await interaction.reply({ embeds: [beEmbed] });
        } else if (subcommand === 'map') {
            const mapEmbed = new EmbedBuilder()
                .setTitle('Mystic Map')
                .setDescription('Hier ist die Karte des Mystic Netzwerks:')
                .setImage('https://cdn.discordapp.com/attachments/1019203308231073842/1200448158916935690/bluemap-screenshot_3.png?ex=65c63778&is=65b3c278&hm=967efae58775fb160b2664ab61dffabb36f49c409e84eae58c48348bbed&')
                .addFields(
                    { name: 'Map Link', value: '[Link](https://map.mystic-celduin.de/)', inline: false }
                )
                .setFooter({ text: 'Wir wünschen dir viel Spaß auf Mystic Celduin' });

            await interaction.reply({ embeds: [mapEmbed] });

  } else if (subcommand === 'vote') {  // New logic for vote subcommand
            const voteEmbed = new EmbedBuilder()
                .setTitle('Vote für den Server')
                .setDescription('Hier sind die Links zum Voten:')
                .addFields(
                    { name: 'MC Server List', value: '[Link](https://mcsl.name/57801/Spielername)', inline: false },
                    { name: 'Minecraft Server EU', value: '[Link](https://minecraft-server.eu/vote/index/22A0A)', inline: false },
                    { name: 'Minecraft Server List', value: '[Link](https://minecraft-server-list.com/server/498729/)', inline: false },
                    { name: 'Minecraft-MP', value: '[Link](https://minecraft-mp.com/server/329306/vote/)', inline: false },
                    { name: 'Planet Minecraft (No Bedrock Support)', value: '[Link](https://www.planetminecraft.com/server/mystic-celduin-5931715/vote/)', inline: false }
                )
                .setFooter({ text: 'Du erhältst 950 MCT + eine Überraschung für deine Stimme!' });

            await interaction.reply({ embeds: [voteEmbed] });
  } else if (subcommand === 'ban') {
            const bEmbed = new EmbedBuilder()
                .setTitle('Ban Informationen')
                .setColor('#FF0000') // Red color for bans
                .setThumbnail(logoUrl) // Add the logo to the ban embed
                .addFields(
                    { name: 'Bans', value: 'Ihr findet alle Bans unter [MysticBans](https://bans.mystic-celduin.de/index.php)' },
                );

            await interaction.reply({ embeds: [bEmbed] });
        } else if (subcommand === 'linkung') { // New logic for linkung subcommand
            const linkungEmbed = new EmbedBuilder()
                .setTitle('Account-Verlinkung')
                .setColor('#0099ff')
                .setThumbnail(logoUrl) 
                .addFields(
                    { name: 'Account-Verlinkung', value: 'Wenn ihr sowohl Java als auch Bedrock Edition spielt, verlinkt bitte eure Accounts über [Geyser](https://link.geysermc.org/), um nicht mit zwei Accounts zu spielen!\n**Bitte übersetzt die Seite nicht, da sie sonst nicht richtig funktioniert**' }
                );

            await interaction.reply({ embeds: [linkungEmbed] });
        }
    }
};
