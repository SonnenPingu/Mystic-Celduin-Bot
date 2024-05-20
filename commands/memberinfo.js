const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs'); // For file system operations

// Load or initialize user data
let userData = {};
try {
    const userDataString = fs.readFileSync('userdata.json', 'utf8');
    userData = JSON.parse(userDataString, (key, value) => {
        // Convert numeric values to strings for embed display
        if (typeof value === 'number') {
            return value.toString();
        }
        return value;
    });
} catch (error) {
    console.error('Error loading user data:', error);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('memberinfo')
        .setDescription('Shows information about a member.')
        .addUserOption(option => option.setName('user').setDescription('The member whose information you want to see.').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Only administrators can use

    async execute(interaction) {
        const targetMember = interaction.options.getMember('user');

        if (!targetMember) {
            return interaction.reply({ content: 'That member was not found.', ephemeral: true });
        }

        // Load the latest user data on each command execution
        let userData = {};
        try {
            const userDataString = fs.readFileSync('userdata.json', 'utf8');
            userData = JSON.parse(userDataString, (key, value) => {
                if (typeof value === 'string' && !isNaN(value)) {
                    return value; // Keep strings if they are numeric
                }
                return value;
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn('User data file not found. Starting with empty data.');
            } else {
                console.error('Error loading user data:', error);
            }
        }

        const joinedAtTimestamp = Math.floor(targetMember.joinedTimestamp / 1000); // Convert to seconds for Discord timestamp
        const createdAtTimestamp = Math.floor(targetMember.user.createdTimestamp / 1000);
        const timeoutTimestamp = targetMember.communicationDisabledUntilTimestamp ? Math.floor(targetMember.communicationDisabledUntilTimestamp / 1000) : null;

        const memberInfoEmbed = new EmbedBuilder()
            .setTitle(`Information for ${targetMember.user.tag}`)
            .setThumbnail(targetMember.user.displayAvatarURL())
            .addFields(
                { name: 'Name:', value: targetMember.user.username },
                { name: 'ID:', value: targetMember.id },
                { name: 'Nickname:', value: targetMember.nickname || 'None' },
                { name: 'Messages Sent:', value: String(userData[targetMember.id]?.messageCount || '0') },
                { name: 'Voice Minutes:', value: String(userData[targetMember.id]?.voiceMinutes || '0') },
                { name: 'Timeout:', value: timeoutTimestamp ? `<t:${timeoutTimestamp}:F>` : 'None' },
                { name: 'Account Created On:', value: `<t:${createdAtTimestamp}:F>` },
                { name: 'Joined Server On:', value: `<t:${joinedAtTimestamp}:F>` }
            )
            .setColor('#0099ff');

        if (targetMember.user.bannerURL()) {
            memberInfoEmbed.setImage(targetMember.user.bannerURL({ dynamic: true }));
        }

        await interaction.reply({ embeds: [memberInfoEmbed] });
    }
};
