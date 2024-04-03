//Update the sytem to SlashCommands.

const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');

const donationCommand = new SlashCommandBuilder()
  .setName('donation')
  .setDescription('Zeigt Informationen zu Spenden an')
  .toJSON();

const executeCommand = async (interaction) => {
  if (interaction.commandName === 'donation') {
    const donationEmbed = new EmbedBuilder()
      .setTitle('Deine Spendeninformationen')
      .setColor('#0099ff')
      .setDescription('**Dein Text**')
      .addField('1 Dollar', 'Kaufe mir einen Kaffee', true)
      .addField('5 Dollar', 'Werde Unterstützer', true)
      .setFooter({ text: 'Danke für deine Spende!' })
      .toJSON();

    await interaction.reply({ embeds: [donationEmbed] });
  }
};

module.exports = {
  data: [donationCommand],
  execute: executeCommand,
};


const rulesCommand = new SlashCommandBuilder()
  .setName('rules')
  .setDescription('Zeigt die Serverregeln an')
  .toJSON();

const executeCommand = async (interaction) => {
  if (interaction.commandName === 'rules') {
    const rulesEmbed = new EmbedBuilder()
      .setTitle('**Serverregeln**')
      .setColor('#DE350B')
      .setThumbnail('https://cdn.discordapp.com/icons/your_server_id/your_server_icon.png')
      .addFields(
        { name: 'Regel 1', value: 'Dein Text', inline: true },
        { name: 'Regel 2', value: 'Dein Text', inline: true },
        { name: 'Regel 3', value: 'Dein Text', inline: true },
      )
      .setFooter({ text: 'Viel Spaß und viel Glück!' })
      .toJSON();

    await interaction.reply({ embeds: [rulesEmbed] });
  }
};

module.exports = {
  data: [rulesCommand],
  execute: executeCommand,
};



const pollCommand = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Erstelle eine Umfrage')
  .addOption(
    option => option.setName('question')
      .setDescription('Die Frage der Umfrage')
      .setRequired(true)
      .setType('STRING'),
  )
  .addOption(
    option => option.setName('options')
      .setDescription('Die Optionen der Umfrage (durch Komma getrennt)')
      .setRequired(true)
      .setType('STRING'),
  )
  .toJSON();

const executeCommand = async (interaction) => {
  if (interaction.commandName === 'poll') {
    const question = interaction.options.getString('question');
    const options = interaction.options.getString('options').split(',');

    const buttons = options.map(option => {
      return new MessageButton()
        .setLabel(option)
        .setStyle('PRIMARY')
        .setCustomId(option);
    });

    const messageActionRow = new MessageActionRow().addComponents(buttons);

    const pollEmbed = new EmbedBuilder()
      .setTitle('**Umfrage**')
      .setColor('#DE35
