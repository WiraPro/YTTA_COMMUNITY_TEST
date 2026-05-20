// ╔══════════════════════════════════════════════╗
// ║         YTTA COMMUNITY BOT - v1.0.0         ║
// ║        Built with ❤️ for YTTA Community      ║
// ╚══════════════════════════════════════════════╝

const {
  Client, GatewayIntentBits, Partials, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, PermissionFlagsBits,
  SlashCommandBuilder, REST, Routes, Collection,
  ChannelType, Events
} = require('discord.js');
const express = require('express');
require('dotenv').config();

// ─── Keep-alive server (wajib untuk Railway) ───
const app = express();
app.get('/', (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif;background:#1a1a2e;color:#e0e0ff;text-align:center;padding:50px">
      <h1>🎮 YTTA Community Bot</h1>
      <p>✅ Bot sedang berjalan dengan baik!</p>
      <p>Status: <span style="color:#00ff88">ONLINE</span></p>
    </body></html>
  `);
});
app.listen(process.env.PORT || 3000, () => {
  console.log(`[WEB] Keep-alive server aktif di port ${process.env.PORT || 3000}`);
});

// ─── Inisialisasi Client ───
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ─── Penyimpanan Data (In-Memory) ───
const guildConfigs = new Map();   // { announcementChannelId, welcomeChannelId, goodbyeChannelId, logChannelId }
const activeTrivia  = new Map();  // userId -> { question, answer, timeout }
const userPoints    = new Map();  // userId -> points
const reactionRoleMessages = new Map(); // messageId -> { roleId, emoji }

// ─── Warna Embed Tema ───
const COLORS = {
  primary : 0x5865F2,
  success : 0x57F287,
  warning : 0xFEE75C,
  danger  : 0xED4245,
  info    : 0x00B0F4,
  gold    : 0xFFD700,
  ytta    : 0xA855F7,
};

// ─── Trivia Questions (Indonesia + Umum) ───
const TRIVIA = [
  { q: "Ibu kota Indonesia adalah?", a: "Jakarta", opts: ["Jakarta", "Surabaya", "Bandung", "Medan"] },
  { q: "Berapa hasil dari 7 x 8?", a: "56", opts: ["48", "56", "63", "64"] },
  { q: "Planet terbesar di tata surya adalah?", a: "Jupiter", opts: ["Saturn", "Uranus", "Jupiter", "Neptunus"] },
  { q: "Bahasa pemrograman yang dibuat oleh Guido van Rossum?", a: "Python", opts: ["Java", "Python", "Ruby", "C++"] },
  { q: "Siapa penemu telepon?", a: "Alexander Graham Bell", opts: ["Thomas Edison", "Nikola Tesla", "Alexander Graham Bell", "Isaac Newton"] },
  { q: "Berapa sisi pada segitiga?", a: "3", opts: ["2", "3", "4", "5"] },
  { q: "Apa nama mata uang Jepang?", a: "Yen", opts: ["Won", "Yuan", "Yen", "Ringgit"] },
  { q: "Siapa penulis Harry Potter?", a: "J.K. Rowling", opts: ["J.K. Rowling", "Tolkien", "Stephen King", "Dan Brown"] },
  { q: "Berapa warna dalam pelangi?", a: "7", opts: ["5", "6", "7", "8"] },
  { q: "Negara dengan luas terbesar di dunia adalah?", a: "Rusia", opts: ["Amerika Serikat", "China", "Rusia", "Kanada"] },
  { q: "Gas yang paling banyak di atmosfer bumi?", a: "Nitrogen", opts: ["Oksigen", "Nitrogen", "Karbon Dioksida", "Argon"] },
  { q: "Siapa presiden pertama Indonesia?", a: "Soekarno", opts: ["Soekarno", "Soeharto", "Habibie", "Megawati"] },
  { q: "Apa nama galaksi kita?", a: "Bimasakti", opts: ["Andromeda", "Bimasakti", "Triangulum", "Sombrero"] },
  { q: "Berapa detik dalam satu menit?", a: "60", opts: ["60", "100", "30", "120"] },
  { q: "Buah apakah yang dikenal sebagai 'Raja Buah' di Indonesia?", a: "Durian", opts: ["Mangga", "Nangka", "Durian", "Rambutan"] },
];

// ─── 8Ball Answers ───
const BALL_ANSWERS = [
  "✅ Ya, pasti!", "✅ Tentu saja!", "✅ Sangat mungkin!", "✅ Kelihatannya ya.",
  "🔮 Coba lagi nanti.", "🔮 Tidak bisa diprediksi sekarang.", "🔮 Fokus dulu, baru tanya.",
  "❌ Jangan harap!", "❌ Kemungkinan besar tidak.", "❌ Hmm, kayaknya tidak deh.", "❌ Jawaban dengan tegas: TIDAK.",
];

// ─── Fungsi Helper ───
function getConfig(guildId) {
  if (!guildConfigs.has(guildId)) {
    guildConfigs.set(guildId, {
      announcementChannelId: null,
      welcomeChannelId: null,
      goodbyeChannelId: null,
      logChannelId: null,
    });
  }
  return guildConfigs.get(guildId);
}

function addPoints(userId, pts) {
  userPoints.set(userId, (userPoints.get(userId) || 0) + pts);
}

function getPoints(userId) {
  return userPoints.get(userId) || 0;
}

function makeEmbed(title, desc, color = COLORS.ytta) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'YTTA Community Bot', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
}

async function sendLog(guild, message) {
  const config = getConfig(guild.id);
  if (config.logChannelId) {
    const ch = guild.channels.cache.get(config.logChannelId);
    if (ch) ch.send(message).catch(() => {});
  }
}

// ─── Definisi Slash Commands ───
const commands = [
  // ══ ADMIN ══
  new SlashCommandBuilder()
    .setName('setup-announcement')
    .setDescription('⚙️ Set channel untuk pengumuman server')
    .addChannelOption(o => o.setName('channel').setDescription('Channel announcement').setRequired(true).addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('👋 Set channel untuk pesan selamat datang (member masuk)')
    .addChannelOption(o => o.setName('channel').setDescription('Channel welcome').setRequired(true).addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('setup-goodbye')
    .setDescription('👋 Set channel untuk pesan perpisahan (member keluar)')
    .addChannelOption(o => o.setName('channel').setDescription('Channel goodbye').setRequired(true).addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('setup-log')
    .setDescription('⚙️ Set channel untuk log aktivitas bot (moderasi, dll)')
    .addChannelOption(o => o.setName('channel').setDescription('Channel log').setRequired(true).addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('📢 Kirim pengumuman resmi ke channel announcement')
    .addStringOption(o => o.setName('judul').setDescription('Judul pengumuman').setRequired(true))
    .addStringOption(o => o.setName('pesan').setDescription('Isi pengumuman (gunakan \\n untuk baris baru)').setRequired(true))
    .addStringOption(o => o.setName('warna').setDescription('Warna embed').addChoices(
      { name: '🟣 YTTA Purple', value: 'ytta' },
      { name: '🔵 Biru', value: 'info' },
      { name: '🟢 Hijau', value: 'success' },
      { name: '🔴 Merah', value: 'danger' },
      { name: '🟡 Kuning', value: 'warning' },
      { name: '🥇 Emas', value: 'gold' },
    ))
    .addStringOption(o => o.setName('ping').setDescription('Ping siapa?').addChoices(
      { name: 'Semua (@everyone)', value: 'everyone' },
      { name: 'Here (@here)', value: 'here' },
      { name: 'Tanpa ping', value: 'none' },
    ))
    .addStringOption(o => o.setName('gambar').setDescription('URL gambar untuk embed (opsional)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('setup-roles')
    .setDescription('🎭 Buat pesan reaction role di channel ini')
    .addStringOption(o => o.setName('judul').setDescription('Judul pesan role').setRequired(true))
    .addStringOption(o => o.setName('deskripsi').setDescription('Deskripsi pesan role').setRequired(true))
    .addRoleOption(o => o.setName('role1').setDescription('Role 1').setRequired(true))
    .addStringOption(o => o.setName('emoji1').setDescription('Emoji untuk role 1 (contoh: 🎮)').setRequired(true))
    .addRoleOption(o => o.setName('role2').setDescription('Role 2'))
    .addStringOption(o => o.setName('emoji2').setDescription('Emoji untuk role 2'))
    .addRoleOption(o => o.setName('role3').setDescription('Role 3'))
    .addStringOption(o => o.setName('emoji3').setDescription('Emoji untuk role 3'))
    .addRoleOption(o => o.setName('role4').setDescription('Role 4'))
    .addStringOption(o => o.setName('emoji4').setDescription('Emoji untuk role 4'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  // ══ ROLE MANAGEMENT ══
  new SlashCommandBuilder()
    .setName('giverole')
    .setDescription('➕ Berikan role ke member')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Role yang diberikan').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('➖ Hapus role dari member')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Role yang dihapus').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  // ══ MODERASI ══
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Kick member dari server')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(o => o.setName('alasan').setDescription('Alasan kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Ban member dari server')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(o => o.setName('alasan').setDescription('Alasan ban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('⏰ Timeout member')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addIntegerOption(o => o.setName('menit').setDescription('Durasi timeout (menit)').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName('alasan').setDescription('Alasan timeout'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🧹 Hapus pesan di channel ini')
    .addIntegerOption(o => o.setName('jumlah').setDescription('Jumlah pesan (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // ══ INFO ══
  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('🏠 Lihat info server YTTA Community'),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('👤 Lihat info tentang user')
    .addUserOption(o => o.setName('user').setDescription('User yang ingin dilihat')),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Cek latency bot'),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Lihat leaderboard poin trivia'),

  // ══ MINI GAMES ══
  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('🪙 Lempar koin!'),

  new SlashCommandBuilder()
    .setName('rps')
    .setDescription('✊ Batu Gunting Kertas!')
    .addStringOption(o => o.setName('pilihan').setDescription('Pilihanmu').setRequired(true).addChoices(
      { name: '🪨 Batu', value: 'batu' },
      { name: '✂️ Gunting', value: 'gunting' },
      { name: '📄 Kertas', value: 'kertas' },
    )),

  new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('🧠 Main trivia dan kumpulkan poin!'),

  new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('🎱 Tanya bola ajaib!')
    .addStringOption(o => o.setName('pertanyaan').setDescription('Pertanyaanmu').setRequired(true)),

  new SlashCommandBuilder()
    .setName('tebakangka')
    .setDescription('🔢 Tebak angka 1-100!')
    .addIntegerOption(o => o.setName('tebakan').setDescription('Tebakan angkamu').setRequired(true).setMinValue(1).setMaxValue(100)),

  new SlashCommandBuilder()
    .setName('poin')
    .setDescription('💎 Lihat total poin kamu'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Tampilkan semua perintah bot'),
].map(c => c.toJSON());

// ─── Register Commands ───
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  try {
    console.log('[CMD] Mendaftarkan slash commands...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('[CMD] ✅ Slash commands berhasil didaftarkan!');
  } catch (err) {
    console.error('[CMD] ❌ Gagal mendaftarkan commands:', err);
  }
}

// ─── Event: Bot Ready ───
client.once(Events.ClientReady, async () => {
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  ✅ ${client.user.tag} ONLINE!`);
  console.log(`║  🌐 Servers: ${client.guilds.cache.size}`);
  console.log(`╚══════════════════════════════════════╝\n`);
  
  client.user.setActivity('YTTA Community 🎮', { type: 0 });
  await registerCommands();
});

// ─── Event: Member Join ───
client.on(Events.GuildMemberAdd, async (member) => {
  const config = getConfig(member.guild.id);

  // Kirim ke welcome channel jika sudah diset, fallback ke system channel
  const welcomeCh = config.welcomeChannelId
    ? member.guild.channels.cache.get(config.welcomeChannelId)
    : member.guild.systemChannel;

  if (welcomeCh) {
    const embed = new EmbedBuilder()
      .setTitle('🎉 Selamat Datang!')
      .setDescription(
        `Halo ${member}, selamat datang di **YTTA Community**! 🎊\n\n` +
        `Kamu adalah member ke-**${member.guild.memberCount}**!\n` +
        `Silakan baca rules dan ambil role kamu ya~`
      )
      .setColor(COLORS.success)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Username', value: member.user.tag, inline: true },
        { name: '🆔 ID', value: member.id, inline: true },
        { name: '📅 Akun Dibuat', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'YTTA Community' });
    welcomeCh.send({ embeds: [embed] }).catch(() => {});
  }

  await sendLog(member.guild, `📥 **${member.user.tag}** bergabung ke server. (Total: ${member.guild.memberCount})`);
});

// ─── Event: Member Leave ───
client.on(Events.GuildMemberRemove, async (member) => {
  const config = getConfig(member.guild.id);

  const goodbyeCh = config.goodbyeChannelId
    ? member.guild.channels.cache.get(config.goodbyeChannelId)
    : null;

  if (goodbyeCh) {
    const embed = new EmbedBuilder()
      .setTitle('👋 Sampai Jumpa!')
      .setDescription(
        `**${member.user.tag}** telah meninggalkan server.\n\n` +
        `Semoga kita bisa bertemu lagi! 🙏`
      )
      .setColor(COLORS.danger)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Username', value: member.user.tag, inline: true },
        { name: '👥 Member Tersisa', value: `${member.guild.memberCount}`, inline: true },
        { name: '📅 Bergabung', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Tidak diketahui', inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'YTTA Community' });
    goodbyeCh.send({ embeds: [embed] }).catch(() => {});
  }

  await sendLog(member.guild, `📤 **${member.user.tag}** meninggalkan server. (Total: ${member.guild.memberCount})`);
});

// ─── Event: Reaction Add (Reaction Roles) ───
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
  
  const key = `${reaction.message.id}_${reaction.emoji.name}`;
  if (reactionRoleMessages.has(key)) {
    const roleId = reactionRoleMessages.get(key);
    const guild  = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    const role = guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.add(role).catch(console.error);
      user.send(`✅ Role **${role.name}** berhasil diberikan di server **${guild.name}**!`).catch(() => {});
    }
  }
});

// ─── Event: Reaction Remove (Reaction Roles) ───
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
  
  const key = `${reaction.message.id}_${reaction.emoji.name}`;
  if (reactionRoleMessages.has(key)) {
    const roleId = reactionRoleMessages.get(key);
    const guild  = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    const role = guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.remove(role).catch(console.error);
      user.send(`❌ Role **${role.name}** berhasil dihapus dari server **${guild.name}**!`).catch(() => {});
    }
  }
});

// ─── Event: Interaction (Slash Commands + Buttons) ───
client.on(Events.InteractionCreate, async (interaction) => {
  
  // ── Button Interactions ──
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('trivia_')) {
      await handleTriviaButton(interaction);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, guild, member, channel } = interaction;

  try {
    switch (commandName) {

      // ════════════════════════
      //   SETUP ANNOUNCEMENT
      // ════════════════════════
      case 'setup-announcement': {
        const ch = options.getChannel('channel');
        getConfig(guild.id).announcementChannelId = ch.id;
        await interaction.reply({
          embeds: [makeEmbed('✅ Setup Berhasil!', `Channel announcement telah diset ke ${ch}!\nGunakan \`/announce\` untuk mengirim pengumuman.`, COLORS.success)],
          ephemeral: true
        });
        break;
      }

      // ════════════════════════
      //   SETUP WELCOME
      // ════════════════════════
      case 'setup-welcome': {
        const ch = options.getChannel('channel');
        getConfig(guild.id).welcomeChannelId = ch.id;
        await interaction.reply({
          embeds: [makeEmbed('✅ Setup Welcome Berhasil!',
            `Channel untuk pesan **selamat datang** telah diset ke ${ch}!\n\nSetiap member baru yang masuk akan disambut di channel ini. 🎉`,
            COLORS.success)],
          ephemeral: true
        });
        break;
      }

      // ════════════════════════
      //   SETUP GOODBYE
      // ════════════════════════
      case 'setup-goodbye': {
        const ch = options.getChannel('channel');
        getConfig(guild.id).goodbyeChannelId = ch.id;
        await interaction.reply({
          embeds: [makeEmbed('✅ Setup Goodbye Berhasil!',
            `Channel untuk pesan **perpisahan** telah diset ke ${ch}!\n\nSetiap member yang keluar akan dikirim pesan di channel ini. 👋`,
            COLORS.success)],
          ephemeral: true
        });
        break;
      }

      // ════════════════════════
      //   SETUP LOG
      // ════════════════════════
      case 'setup-log': {
        const ch = options.getChannel('channel');
        getConfig(guild.id).logChannelId = ch.id;
        await interaction.reply({
          embeds: [makeEmbed('✅ Setup Log Berhasil!', `Channel log telah diset ke ${ch}!`, COLORS.success)],
          ephemeral: true
        });
        break;
      }

      // ════════════════════════
      //   ANNOUNCE
      // ════════════════════════
      case 'announce': {
        const config = getConfig(guild.id);
        if (!config.announcementChannelId) {
          return interaction.reply({
            embeds: [makeEmbed('❌ Error', 'Channel announcement belum diset!\nAdmin harus jalankan `/setup-announcement` dulu.', COLORS.danger)],
            ephemeral: true
          });
        }
        const annCh = guild.channels.cache.get(config.announcementChannelId);
        if (!annCh) {
          return interaction.reply({
            embeds: [makeEmbed('❌ Error', 'Channel announcement tidak ditemukan! Coba setup ulang.', COLORS.danger)],
            ephemeral: true
          });
        }
        const judul = options.getString('judul');
        const pesan = options.getString('pesan').replace(/\\n/g, '\n');
        const warnaKey = options.getString('warna') || 'ytta';
        const pingOpt  = options.getString('ping') || 'none';
        const gambar   = options.getString('gambar');

        const embed = new EmbedBuilder()
          .setTitle(`📢 ${judul}`)
          .setDescription(pesan)
          .setColor(COLORS[warnaKey] || COLORS.ytta)
          .setTimestamp()
          .setFooter({ text: `Diumumkan oleh ${member.user.tag} | YTTA Community` });

        if (gambar) embed.setImage(gambar);

        let pingText = '';
        if (pingOpt === 'everyone') pingText = '@everyone\n';
        else if (pingOpt === 'here') pingText = '@here\n';

        await annCh.send({ content: pingText || null, embeds: [embed] });
        
        // Publish jika announcement channel
        const sent = await annCh.messages.fetch({ limit: 1 });
        const msg  = sent.first();
        if (annCh.type === ChannelType.GuildAnnouncement && msg?.crosspostable) {
          await msg.crosspost().catch(() => {});
        }

        await interaction.reply({
          embeds: [makeEmbed('✅ Pengumuman Terkirim!', `Pengumuman berhasil dikirim ke ${annCh}!`, COLORS.success)],
          ephemeral: true
        });
        await sendLog(guild, `📢 **${member.user.tag}** mengirim pengumuman: **${judul}**`);
        break;
      }

      // ════════════════════════
      //   SETUP ROLES
      // ════════════════════════
      case 'setup-roles': {
        const judul = options.getString('judul');
        const deskripsi = options.getString('deskripsi');
        
        const roles  = [];
        const emojis = [];
        for (let i = 1; i <= 4; i++) {
          const r = options.getRole(`role${i}`);
          const e = options.getString(`emoji${i}`);
          if (r && e) { roles.push(r); emojis.push(e); }
        }
        
        if (roles.length === 0) {
          return interaction.reply({ embeds: [makeEmbed('❌ Error', 'Minimal 1 role harus diisi!', COLORS.danger)], ephemeral: true });
        }

        let desc = `${deskripsi}\n\n`;
        roles.forEach((r, i) => { desc += `${emojis[i]} → **${r.name}**\n`; });
        desc += '\n*React dengan emoji untuk mendapatkan role!*';

        const embed = makeEmbed(`🎭 ${judul}`, desc, COLORS.ytta);
        const msg = await channel.send({ embeds: [embed] });
        
        // Tambahkan reaksi dan simpan mapping
        for (let i = 0; i < roles.length; i++) {
          await msg.react(emojis[i]).catch(() => {});
          const key = `${msg.id}_${emojis[i]}`;
          reactionRoleMessages.set(key, roles[i].id);
        }

        await interaction.reply({
          embeds: [makeEmbed('✅ Reaction Role Dibuat!', `Pesan reaction role berhasil dibuat di ${channel}!`, COLORS.success)],
          ephemeral: true
        });
        break;
      }

      // ════════════════════════
      //   GIVE ROLE
      // ════════════════════════
      case 'giverole': {
        const target = options.getMember('user');
        const role   = options.getRole('role');
        
        if (target.roles.cache.has(role.id)) {
          return interaction.reply({ embeds: [makeEmbed('⚠️ Info', `${target} sudah punya role **${role.name}**!`, COLORS.warning)], ephemeral: true });
        }
        await target.roles.add(role);
        await interaction.reply({
          embeds: [makeEmbed('✅ Role Diberikan!', `Role **${role.name}** berhasil diberikan ke ${target}!`, COLORS.success)]
        });
        await sendLog(guild, `➕ **${member.user.tag}** memberikan role **${role.name}** ke **${target.user.tag}**`);
        break;
      }

      // ════════════════════════
      //   REMOVE ROLE
      // ════════════════════════
      case 'removerole': {
        const target = options.getMember('user');
        const role   = options.getRole('role');
        
        if (!target.roles.cache.has(role.id)) {
          return interaction.reply({ embeds: [makeEmbed('⚠️ Info', `${target} tidak punya role **${role.name}**!`, COLORS.warning)], ephemeral: true });
        }
        await target.roles.remove(role);
        await interaction.reply({
          embeds: [makeEmbed('✅ Role Dihapus!', `Role **${role.name}** berhasil dihapus dari ${target}!`, COLORS.success)]
        });
        await sendLog(guild, `➖ **${member.user.tag}** menghapus role **${role.name}** dari **${target.user.tag}**`);
        break;
      }

      // ════════════════════════
      //   KICK
      // ════════════════════════
      case 'kick': {
        const target = options.getMember('user');
        const alasan = options.getString('alasan') || 'Tidak ada alasan';
        
        if (!target.kickable) {
          return interaction.reply({ embeds: [makeEmbed('❌ Error', 'Bot tidak bisa kick user ini!', COLORS.danger)], ephemeral: true });
        }
        await target.kick(alasan);
        await interaction.reply({
          embeds: [makeEmbed('👢 Member di-Kick', `**${target.user.tag}** telah di-kick.\n**Alasan:** ${alasan}`, COLORS.warning)]
        });
        await sendLog(guild, `👢 **${member.user.tag}** kick **${target.user.tag}** | Alasan: ${alasan}`);
        break;
      }

      // ════════════════════════
      //   BAN
      // ════════════════════════
      case 'ban': {
        const target = options.getMember('user');
        const alasan = options.getString('alasan') || 'Tidak ada alasan';
        
        if (!target.bannable) {
          return interaction.reply({ embeds: [makeEmbed('❌ Error', 'Bot tidak bisa ban user ini!', COLORS.danger)], ephemeral: true });
        }
        await target.ban({ reason: alasan });
        await interaction.reply({
          embeds: [makeEmbed('🔨 Member di-Ban', `**${target.user.tag}** telah di-ban.\n**Alasan:** ${alasan}`, COLORS.danger)]
        });
        await sendLog(guild, `🔨 **${member.user.tag}** ban **${target.user.tag}** | Alasan: ${alasan}`);
        break;
      }

      // ════════════════════════
      //   TIMEOUT
      // ════════════════════════
      case 'timeout': {
        const target = options.getMember('user');
        const menit  = options.getInteger('menit');
        const alasan = options.getString('alasan') || 'Tidak ada alasan';
        const durasi = menit * 60 * 1000;
        
        await target.timeout(durasi, alasan);
        await interaction.reply({
          embeds: [makeEmbed('⏰ Member di-Timeout', `**${target.user.tag}** di-timeout selama **${menit} menit**.\n**Alasan:** ${alasan}`, COLORS.warning)]
        });
        await sendLog(guild, `⏰ **${member.user.tag}** timeout **${target.user.tag}** (${menit} menit) | Alasan: ${alasan}`);
        break;
      }

      // ════════════════════════
      //   CLEAR
      // ════════════════════════
      case 'clear': {
        const jumlah = options.getInteger('jumlah');
        const deleted = await channel.bulkDelete(jumlah, true).catch(() => null);
        await interaction.reply({
          embeds: [makeEmbed('🧹 Pesan Dihapus', `Berhasil menghapus **${deleted?.size || 0}** pesan!`, COLORS.success)],
          ephemeral: true
        });
        await sendLog(guild, `🧹 **${member.user.tag}** menghapus ${deleted?.size || 0} pesan di ${channel}`);
        break;
      }

      // ════════════════════════
      //   SERVER INFO
      // ════════════════════════
      case 'serverinfo': {
        const owner = await guild.fetchOwner();
        const embed = new EmbedBuilder()
          .setTitle(`🏠 ${guild.name}`)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setColor(COLORS.ytta)
          .addFields(
            { name: '👑 Owner', value: owner.user.tag, inline: true },
            { name: '👥 Member', value: `${guild.memberCount}`, inline: true },
            { name: '📅 Dibuat', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
            { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
            { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
            { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'YTTA Community Bot' });
        await interaction.reply({ embeds: [embed] });
        break;
      }

      // ════════════════════════
      //   USER INFO
      // ════════════════════════
      case 'userinfo': {
        const target = options.getMember('user') || member;
        const roles  = target.roles.cache.filter(r => r.id !== guild.id).map(r => r.toString()).join(', ') || 'Tidak ada';
        const embed  = new EmbedBuilder()
          .setTitle(`👤 ${target.user.tag}`)
          .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
          .setColor(target.displayHexColor || COLORS.ytta)
          .addFields(
            { name: '🆔 ID', value: target.id, inline: true },
            { name: '📅 Akun Dibuat', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:D>`, inline: true },
            { name: '📥 Bergabung', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>`, inline: true },
            { name: '🤖 Bot?', value: target.user.bot ? 'Ya' : 'Tidak', inline: true },
            { name: '💎 Poin Trivia', value: `${getPoints(target.id)}`, inline: true },
            { name: '🎭 Roles', value: roles.length > 1024 ? roles.substring(0, 1020) + '...' : roles },
          )
          .setTimestamp()
          .setFooter({ text: 'YTTA Community Bot' });
        await interaction.reply({ embeds: [embed] });
        break;
      }

      // ════════════════════════
      //   PING
      // ════════════════════════
      case 'ping': {
        const start = Date.now();
        await interaction.reply({ content: '🏓 Mengecek ping...' });
        const latency = Date.now() - start;
        await interaction.editReply({
          content: '',
          embeds: [makeEmbed('🏓 Pong!', `> **Bot Latency:** \`${latency}ms\`\n> **API Latency:** \`${Math.round(client.ws.ping)}ms\``, COLORS.info)]
        });
        break;
      }

      // ════════════════════════
      //   LEADERBOARD
      // ════════════════════════
      case 'leaderboard': {
        if (userPoints.size === 0) {
          return interaction.reply({ embeds: [makeEmbed('🏆 Leaderboard', 'Belum ada yang main trivia!\nCoba `/trivia` sekarang!', COLORS.gold)] });
        }
        const sorted = [...userPoints.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        let desc = '';
        for (let i = 0; i < sorted.length; i++) {
          const user = await client.users.fetch(sorted[i][0]).catch(() => null);
          const name = user ? user.username : 'Unknown User';
          desc += `${medals[i]} **${name}** — \`${sorted[i][1]} poin\`\n`;
        }
        await interaction.reply({ embeds: [makeEmbed('🏆 Leaderboard Trivia', desc, COLORS.gold)] });
        break;
      }

      // ════════════════════════
      //   POIN
      // ════════════════════════
      case 'poin': {
        const pts = getPoints(member.id);
        await interaction.reply({
          embeds: [makeEmbed('💎 Poin Kamu', `Kamu punya **${pts} poin** dari trivia!\n\nMain lebih banyak trivia untuk naik di leaderboard! 🏆\nGunakan \`/leaderboard\` untuk lihat ranking.`, COLORS.gold)]
        });
        break;
      }

      // ════════════════════════
      //   COINFLIP
      // ════════════════════════
      case 'coinflip': {
        const result = Math.random() < 0.5 ? '👑 Heads' : '🪙 Tails';
        const embed  = makeEmbed('🪙 Coin Flip!', `Koin dilempar...\n\n# ${result}`, Math.random() < 0.5 ? COLORS.gold : COLORS.info);
        await interaction.reply({ embeds: [embed] });
        break;
      }

      // ════════════════════════
      //   RPS
      // ════════════════════════
      case 'rps': {
        const pil   = options.getString('pilihan');
        const items = ['batu', 'gunting', 'kertas'];
        const icons = { batu: '🪨', gunting: '✂️', kertas: '📄' };
        const bot   = items[Math.floor(Math.random() * items.length)];
        
        let result, color;
        if (pil === bot) { result = '🤝 **Seri!**'; color = COLORS.warning; }
        else if (
          (pil === 'batu'    && bot === 'gunting') ||
          (pil === 'gunting' && bot === 'kertas')  ||
          (pil === 'kertas'  && bot === 'batu')
        ) { result = '🎉 **Kamu Menang!**'; color = COLORS.success; addPoints(member.id, 2); }
        else { result = '😢 **Kamu Kalah!**'; color = COLORS.danger; }

        await interaction.reply({
          embeds: [makeEmbed('✊ Batu Gunting Kertas!',
            `Kamu pilih: **${icons[pil]} ${pil}**\nBot pilih: **${icons[bot]} ${bot}**\n\n${result}`,
            color)]
        });
        break;
      }

      // ════════════════════════
      //   TRIVIA
      // ════════════════════════
      case 'trivia': {
        if (activeTrivia.has(member.id)) {
          return interaction.reply({ embeds: [makeEmbed('⚠️ Trivia Aktif', 'Kamu masih punya pertanyaan trivia yang belum dijawab!', COLORS.warning)], ephemeral: true });
        }
        const q  = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
        const shuffled = [...q.opts].sort(() => Math.random() - 0.5);
        
        const buttons = shuffled.map((opt, i) => 
          new ButtonBuilder()
            .setCustomId(`trivia_${member.id}_${opt === q.a ? 'correct' : 'wrong'}`)
            .setLabel(opt)
            .setStyle(ButtonStyle.Primary)
        );

        const row = new ActionRowBuilder().addComponents(buttons);
        const timeout = setTimeout(() => {
          activeTrivia.delete(member.id);
        }, 30000);

        activeTrivia.set(member.id, { answer: q.a, timeout });
        
        await interaction.reply({
          embeds: [makeEmbed('🧠 Trivia!', `**${q.q}**\n\nPilih jawaban dalam **30 detik**!\n*(Benar = +5 poin, Salah = +0)*`, COLORS.info)],
          components: [row]
        });
        break;
      }

      // ════════════════════════
      //   8BALL
      // ════════════════════════
      case '8ball': {
        const pertanyaan = options.getString('pertanyaan');
        const jawaban    = BALL_ANSWERS[Math.floor(Math.random() * BALL_ANSWERS.length)];
        await interaction.reply({
          embeds: [makeEmbed('🎱 Magic 8-Ball', `**Pertanyaan:** ${pertanyaan}\n\n**Jawaban:** ${jawaban}`, COLORS.ytta)]
        });
        break;
      }

      // ════════════════════════
      //   TEBAK ANGKA
      // ════════════════════════
      case 'tebakangka': {
        const tebakan = options.getInteger('tebakan');
        const rahasia = Math.floor(Math.random() * 100) + 1;
        
        if (tebakan === rahasia) {
          addPoints(member.id, 10);
          await interaction.reply({
            embeds: [makeEmbed('🎊 BENAR!', `**Tebakan:** ${tebakan}\n**Angka rahasia:** ${rahasia}\n\n🎉 **LUAR BIASA! Kamu benar! +10 poin!**`, COLORS.success)]
          });
        } else {
          const selisih = Math.abs(tebakan - rahasia);
          const hint = tebakan < rahasia ? '📈 Terlalu kecil!' : '📉 Terlalu besar!';
          await interaction.reply({
            embeds: [makeEmbed('❌ Salah!', `**Tebakan:** ${tebakan}\n**Angka rahasia:** ${rahasia}\n\n${hint}\n*Selisih: ${selisih}*`, COLORS.danger)]
          });
        }
        break;
      }

      // ════════════════════════
      //   HELP
      // ════════════════════════
      case 'help': {
        const embed = new EmbedBuilder()
          .setTitle('📖 YTTA Community Bot — Daftar Perintah')
          .setColor(COLORS.ytta)
          .setThumbnail(client.user.displayAvatarURL())
          .addFields(
            {
              name: '⚙️ Admin (perlu permission)',
              value: [
                '`/setup-announcement` — Set channel announcement',
                '`/setup-welcome` — Set channel selamat datang (member masuk)',
                '`/setup-goodbye` — Set channel perpisahan (member keluar)',
                '`/setup-log` — Set channel log aktivitas bot',
                '`/announce` — Kirim pengumuman resmi',
                '`/setup-roles` — Buat reaction role',
              ].join('\n')
            },
            {
              name: '🎭 Role Management',
              value: [
                '`/giverole` — Berikan role ke member',
                '`/removerole` — Hapus role dari member',
              ].join('\n')
            },
            {
              name: '🛡️ Moderasi',
              value: [
                '`/kick` — Kick member',
                '`/ban` — Ban member',
                '`/timeout` — Timeout member',
                '`/clear` — Hapus pesan',
              ].join('\n')
            },
            {
              name: '🎮 Mini Games',
              value: [
                '`/coinflip` — Lempar koin',
                '`/rps` — Batu Gunting Kertas',
                '`/trivia` — Kuis trivia (+5 poin)',
                '`/tebakangka` — Tebak angka 1-100 (+10 poin)',
                '`/8ball` — Tanya bola ajaib',
              ].join('\n')
            },
            {
              name: '📊 Info & Statistik',
              value: [
                '`/serverinfo` — Info server',
                '`/userinfo` — Info user',
                '`/ping` — Cek latency bot',
                '`/poin` — Lihat poin trivia kamu',
                '`/leaderboard` — Ranking trivia',
              ].join('\n')
            },
          )
          .setTimestamp()
          .setFooter({ text: 'YTTA Community Bot v1.0 • Made with ❤️' });
        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  } catch (err) {
    console.error(`[ERR] Command ${commandName}:`, err);
    const errEmbed = makeEmbed('❌ Terjadi Error', `Maaf, ada kesalahan saat menjalankan perintah ini.\n\`${err.message}\``, COLORS.danger);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
    }
  }
});

// ─── Handler: Trivia Button ───
async function handleTriviaButton(interaction) {
  const parts    = interaction.customId.split('_'); // trivia_userId_correct/wrong
  const userId   = parts[1];
  const isCorrect = parts[2] === 'correct';

  if (interaction.user.id !== userId) {
    return interaction.reply({ content: '❌ Ini bukan trivia kamu!', ephemeral: true });
  }

  const game = activeTrivia.get(userId);
  if (!game) {
    return interaction.reply({ content: '⏰ Waktu habis! Trivia sudah berakhir.', ephemeral: true });
  }

  clearTimeout(game.timeout);
  activeTrivia.delete(userId);

  if (isCorrect) {
    addPoints(userId, 5);
    await interaction.update({
      embeds: [makeEmbed('✅ BENAR!', `🎉 Mantap! Jawaban kamu **benar**!\n\n+5 poin ditambahkan! Total: **${getPoints(userId)} poin**`, COLORS.success)],
      components: []
    });
  } else {
    await interaction.update({
      embeds: [makeEmbed('❌ Salah!', `Sayang sekali, jawaban kamu **salah**!\n\nJawaban yang benar: **${game.answer}**\n\nCoba lagi dengan \`/trivia\`!`, COLORS.danger)],
      components: []
    });
  }
}

// ─── Login Bot ───
client.login(process.env.BOT_TOKEN);
