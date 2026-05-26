// ╔══════════════════════════════════════════════╗
// ║       YTTA COMMUNITY BOT - v3.0.0           ║
// ║      Built with ❤️ for YTTA Community        ║
// ╚══════════════════════════════════════════════╝

const {
  Client, GatewayIntentBits, Partials, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  AttachmentBuilder, PermissionFlagsBits,
  SlashCommandBuilder, REST, Routes,
  ChannelType, Events
} = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const express = require('express');
require('dotenv').config();

// ─── Keep-alive server ───
const app = express();
app.get('/', (req, res) => {
  res.send(`<html><body style="font-family:sans-serif;background:#1a1a2e;color:#e0e0ff;text-align:center;padding:50px">
    <h1>🎮 YTTA Community Bot v3</h1><p>✅ Online!</p></body></html>`);
});
app.listen(process.env.PORT || 3000, () => {
  console.log(`[WEB] Server aktif di port ${process.env.PORT || 3000}`);
});

// ─── Client ───
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

// ─── Storage ───
const guildConfigs         = new Map();
const activeTrivia         = new Map();
const userPoints           = new Map();
const reactionRoleMessages = new Map();
const activeGiveaways      = new Map();
const endedGiveaways       = new Map();

// ─── Warna ───
const COLORS = {
  primary: 0x5865F2, success: 0x57F287, warning: 0xFEE75C,
  danger: 0xED4245, info: 0x00B0F4, gold: 0xFFD700, ytta: 0xA855F7,
};

// ─── Trivia ───
const TRIVIA = [
  { q: "Ibu kota Indonesia?", a: "Jakarta", opts: ["Jakarta","Surabaya","Bandung","Medan"] },
  { q: "Hasil 7 x 8?", a: "56", opts: ["48","56","63","64"] },
  { q: "Planet terbesar di tata surya?", a: "Jupiter", opts: ["Saturn","Uranus","Jupiter","Neptunus"] },
  { q: "Bahasa pemrograman Guido van Rossum?", a: "Python", opts: ["Java","Python","Ruby","C++"] },
  { q: "Penemu telepon?", a: "Alexander Graham Bell", opts: ["Thomas Edison","Nikola Tesla","Alexander Graham Bell","Isaac Newton"] },
  { q: "Berapa sisi segitiga?", a: "3", opts: ["2","3","4","5"] },
  { q: "Mata uang Jepang?", a: "Yen", opts: ["Won","Yuan","Yen","Ringgit"] },
  { q: "Penulis Harry Potter?", a: "J.K. Rowling", opts: ["J.K. Rowling","Tolkien","Stephen King","Dan Brown"] },
  { q: "Berapa warna pelangi?", a: "7", opts: ["5","6","7","8"] },
  { q: "Negara terluas di dunia?", a: "Rusia", opts: ["Amerika Serikat","China","Rusia","Kanada"] },
  { q: "Presiden pertama Indonesia?", a: "Soekarno", opts: ["Soekarno","Soeharto","Habibie","Megawati"] },
  { q: "Nama galaksi kita?", a: "Bimasakti", opts: ["Andromeda","Bimasakti","Triangulum","Sombrero"] },
  { q: "Raja Buah di Indonesia?", a: "Durian", opts: ["Mangga","Nangka","Durian","Rambutan"] },
];

const BALL_ANSWERS = [
  "✅ Ya, pasti!","✅ Tentu saja!","✅ Sangat mungkin!",
  "🔮 Coba lagi nanti.","🔮 Tidak bisa diprediksi.",
  "❌ Jangan harap!","❌ Kemungkinan besar tidak.","❌ Jawaban tegas: TIDAK.",
];

// ─── Helpers ───
function getConfig(guildId) {
  if (!guildConfigs.has(guildId)) {
    guildConfigs.set(guildId, {
      announcementChannelId: null,
      welcomeChannelId: null,
      goodbyeChannelId: null,
      logChannelId: null,
      welcomeMsg: null,
      goodbyeMsg: null,
      welcomeImg: null,      // URL gambar statis welcome
      goodbyeImg: null,
      welcomeCard: false,    // pakai welcome card dinamis atau tidak
      welcomeCardBg: null,   // URL background kartu welcome
      welcomeCardColor: '#22c55e', // warna border avatar & teks
    });
  }
  return guildConfigs.get(guildId);
}

function formatMsg(template, member) {
  return template
    .replace(/{user}/g, `${member}`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, member.guild.name)
    .replace(/{count}/g, member.guild.memberCount)
    .replace(/\\n/g, '\n');
}

function addPoints(u, p) { userPoints.set(u, (userPoints.get(u)||0)+p); }
function getPoints(u) { return userPoints.get(u)||0; }

function makeEmbed(title, desc, color = COLORS.ytta) {
  return new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color)
    .setTimestamp().setFooter({ text: 'YTTA Community Bot' });
}

async function sendLog(guild, message) {
  const cfg = getConfig(guild.id);
  if (cfg.logChannelId) {
    const ch = guild.channels.cache.get(cfg.logChannelId);
    if (ch) ch.send(message).catch(()=>{});
  }
}

// ════════════════════════════════════════════
//   WELCOME CARD GENERATOR (Dinamis!)
// ════════════════════════════════════════════
async function generateWelcomeCard(member, config) {
  const W = 1024, H = 400;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  const accentColor = config.welcomeCardColor || '#22c55e';

  // ── Background ──
  if (config.welcomeCardBg) {
    try {
      const bg = await loadImage(config.welcomeCardBg);
      ctx.drawImage(bg, 0, 0, W, H);
    } catch {
      drawDefaultBg(ctx, W, H);
    }
  } else {
    drawDefaultBg(ctx, W, H);
  }

  // ── Overlay gelap agar teks terbaca ──
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, W, H);

  // ── Avatar bulat ──
  const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
  const avatarX   = W / 2;
  const avatarY   = 155;
  const radius    = 90;

  try {
    const avatar = await loadImage(avatarUrl);

    // Border luar (glow)
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, radius + 12, 0, Math.PI * 2);
    ctx.fillStyle = accentColor + '55'; // transparan
    ctx.fill();

    // Border utama
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, radius + 7, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();

    // Clip avatar ke lingkaran
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX - radius, avatarY - radius, radius * 2, radius * 2);
    ctx.restore();
  } catch {
    // Fallback lingkaran default
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();
  }

  // ── Teks WELCOME ──
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur  = 12;

  ctx.font      = 'bold 72px sans-serif';
  ctx.fillStyle = accentColor;
  ctx.fillText('WELCOME', W / 2, 305);

  // ── Nama member ──
  const username = member.user.username.toUpperCase();
  ctx.font      = 'bold 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(username, W / 2, 355);

  // ── Nama server kecil ──
  ctx.font      = '18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(member.guild.name, W / 2, 385);

  ctx.shadowBlur = 0;

  return canvas.toBuffer('image/png');
}

function drawDefaultBg(ctx, W, H) {
  // Gradient ungu gelap default
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0f0c29');
  grad.addColorStop(0.5, '#302b63');
  grad.addColorStop(1, '#24243e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Dekorasi lingkaran
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#a855f7';
  ctx.beginPath(); ctx.arc(100, 100, 180, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W - 80, H - 80, 150, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

// ─── End Giveaway ───
async function endGiveaway(messageId, guild) {
  const gdata = activeGiveaways.get(messageId);
  if (!gdata) return;
  clearTimeout(gdata.timeout);
  activeGiveaways.delete(messageId);
  endedGiveaways.set(messageId, gdata);

  try {
    const ch  = guild.channels.cache.get(gdata.channelId);
    if (!ch) return;
    const msg = await ch.messages.fetch(messageId).catch(()=>null);
    if (!msg) return;

    const reaction = msg.reactions.cache.get(gdata.emoji);
    if (!reaction) {
      await ch.send({ embeds: [makeEmbed('🎉 Giveaway Berakhir!', `**Hadiah:** ${gdata.prize}\n\n😢 Tidak ada peserta!`, COLORS.danger)] });
      await msg.edit({ embeds: [buildGiveawayEmbed(gdata, true, [])] });
      return;
    }

    const users    = await reaction.users.fetch();
    const eligible = users.filter(u => !u.bot).map(u => u);
    if (eligible.length === 0) {
      await ch.send({ embeds: [makeEmbed('🎉 Giveaway Berakhir!', `**Hadiah:** ${gdata.prize}\n\n😢 Tidak ada peserta valid!`, COLORS.danger)] });
      await msg.edit({ embeds: [buildGiveawayEmbed(gdata, true, [])] });
      return;
    }

    const count   = Math.min(gdata.winnersCount, eligible.length);
    const winners = [], pool = [...eligible];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(idx, 1)[0]);
    }

    const winnerMentions = winners.map(u => `<@${u.id}>`).join(', ');
    const adminMention   = `<@${gdata.adminId || gdata.hostId}>`;
    const klaimText      = gdata.klaim || `Hubungi ${adminMention} untuk klaim hadiah!`;

    // ── Edit pesan giveaway asli ──
    await msg.edit({ embeds: [buildGiveawayEmbed(gdata, true, winners)] });

    // ── Kirim pengumuman pemenang di channel ──
    const winEmbed = new EmbedBuilder()
      .setTitle('🎊 SELAMAT! Pemenang Giveaway!')
      .setDescription(
        `**Hadiah:** 🎁 **${gdata.prize}**\n\n` +
        `🏆 **Pemenang (${count} orang):**\n${winnerMentions}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 **Cara Klaim Hadiah:**\n${klaimText}\n\n` +
        `👤 **Penyelenggara:** ${adminMention}\n` +
        `👥 **Total Peserta:** ${eligible.length} orang`
      )
      .setColor(COLORS.gold)
      .setTimestamp()
      .setFooter({ text: 'YTTA Community Giveaway' });

    await ch.send({ content: winnerMentions, embeds: [winEmbed] });

    // ── DM ke setiap pemenang ──
    for (const winner of winners) {
      const dmEmbed = new EmbedBuilder()
        .setTitle('🎉 Selamat! Kamu Menang Giveaway!')
        .setDescription(
          `Hei **${winner.username}**! 🎊\n\n` +
          `Kamu memenangkan giveaway di server **${guild.name}**!\n\n` +
          `**Hadiah:** 🎁 **${gdata.prize}**\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📦 **Cara Klaim:**\n${klaimText}\n\n` +
          `👤 **Hubungi Penyelenggara:** ${adminMention}\n\n` +
          `*Segera klaim hadiahmu sebelum kadaluarsa!*`
        )
        .setColor(COLORS.gold)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: `Giveaway dari ${guild.name}` });

      await winner.send({ embeds: [dmEmbed] }).catch(() => {
        // DM gagal (user matikan DM), kirim notif di channel
        ch.send({ content: `> ⚠️ ${winner}, DM kamu tertutup! Silakan hubungi ${adminMention} langsung untuk klaim hadiah **${gdata.prize}**!` }).catch(()=>{});
      });
    }

    gdata.winners = winners;
    endedGiveaways.set(messageId, gdata);
  } catch (err) { console.error('[GIVEAWAY]', err); }
}

function buildGiveawayEmbed(gdata, ended = false, winners = []) {
  const embed = new EmbedBuilder().setColor(ended ? COLORS.danger : COLORS.gold);
  const adminMention = `<@${gdata.adminId || gdata.hostId}>`;
  if (!ended) {
    embed.setTitle('🎉 GIVEAWAY!')
      .setDescription(
        `**Hadiah:** 🎁 **${gdata.prize}**\n\n` +
        `React dengan **${gdata.emoji}** untuk ikut!\n\n` +
        `**Pemenang:** ${gdata.winnersCount} orang\n` +
        `**Berakhir:** <t:${Math.floor(gdata.endTime/1000)}:R>\n` +
        `**Penyelenggara:** ${adminMention}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 **Cara Klaim:** ${gdata.klaim || `Hubungi ${adminMention}`}`
      )
      .setTimestamp(gdata.endTime)
      .setFooter({ text: 'Berakhir pada' });
  } else {
    const w = winners.length > 0 ? winners.map(u=>`<@${u.id}>`).join(', ') : 'Tidak ada pemenang';
    embed.setTitle('🎉 GIVEAWAY BERAKHIR!')
      .setDescription(
        `**Hadiah:** 🎁 **${gdata.prize}**\n\n` +
        `🏆 **Pemenang:** ${w}\n\n` +
        `📦 **Cara Klaim:** ${gdata.klaim || `Hubungi ${adminMention}`}\n` +
        `👤 **Penyelenggara:** ${adminMention}`
      )
      .setTimestamp()
      .setFooter({ text: 'Giveaway telah berakhir' });
  }
  return embed;
}

// ─── Commands ───
const commands = [
  // ── ADMIN ──
  new SlashCommandBuilder()
    .setName('setup-announcement')
    .setDescription('⚙️ Set channel pengumuman')
    .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)
      .addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('👋 Set channel & kartu selamat datang')
    .addChannelOption(o => o.setName('channel').setDescription('Channel welcome').setRequired(true)
      .addChannelTypes(ChannelType.GuildText))
    .addBooleanOption(o => o.setName('kartu').setDescription('Pakai welcome card otomatis? (foto profil member)'))
    .addStringOption(o => o.setName('background').setDescription('URL gambar background kartu (foto sendiri)'))
    .addStringOption(o => o.setName('warna').setDescription('Warna border & teks kartu (hex, contoh: #22c55e)'))
    .addStringOption(o => o.setName('pesan').setDescription('Teks custom di embed. Gunakan {user} {username} {server} {count}'))
    .addStringOption(o => o.setName('gambar').setDescription('URL gambar statis di embed (jika kartu OFF)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('setup-goodbye')
    .setDescription('👋 Set channel & pesan perpisahan')
    .addChannelOption(o => o.setName('channel').setDescription('Channel goodbye').setRequired(true)
      .addChannelTypes(ChannelType.GuildText))
    .addStringOption(o => o.setName('pesan').setDescription('Pesan custom. Gunakan: {user} {username} {server} {count}'))
    .addStringOption(o => o.setName('gambar').setDescription('URL gambar banner goodbye'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('setup-log')
    .setDescription('⚙️ Set channel log aktivitas bot')
    .addChannelOption(o => o.setName('channel').setDescription('Channel log').setRequired(true)
      .addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('📢 Kirim pengumuman resmi')
    .addStringOption(o => o.setName('judul').setDescription('Judul').setRequired(true))
    .addStringOption(o => o.setName('pesan').setDescription('Isi (\\n = baris baru)').setRequired(true))
    .addStringOption(o => o.setName('warna').setDescription('Warna').addChoices(
      {name:'🟣 YTTA Purple',value:'ytta'},{name:'🔵 Biru',value:'info'},
      {name:'🟢 Hijau',value:'success'},{name:'🔴 Merah',value:'danger'},
      {name:'🟡 Kuning',value:'warning'},{name:'🥇 Emas',value:'gold'},
    ))
    .addStringOption(o => o.setName('ping').setDescription('Ping?').addChoices(
      {name:'@everyone',value:'everyone'},{name:'@here',value:'here'},{name:'Tanpa ping',value:'none'},
    ))
    .addStringOption(o => o.setName('gambar').setDescription('URL gambar'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('setup-roles')
    .setDescription('🎭 Buat reaction role')
    .addStringOption(o => o.setName('judul').setDescription('Judul').setRequired(true))
    .addStringOption(o => o.setName('deskripsi').setDescription('Deskripsi').setRequired(true))
    .addRoleOption(o => o.setName('role1').setDescription('Role 1').setRequired(true))
    .addStringOption(o => o.setName('emoji1').setDescription('Emoji 1').setRequired(true))
    .addRoleOption(o => o.setName('role2').setDescription('Role 2'))
    .addStringOption(o => o.setName('emoji2').setDescription('Emoji 2'))
    .addRoleOption(o => o.setName('role3').setDescription('Role 3'))
    .addStringOption(o => o.setName('emoji3').setDescription('Emoji 3'))
    .addRoleOption(o => o.setName('role4').setDescription('Role 4'))
    .addStringOption(o => o.setName('emoji4').setDescription('Emoji 4'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  // ── GIVEAWAY ──
  new SlashCommandBuilder()
    .setName('giveaway-start')
    .setDescription('🎉 Mulai giveaway baru')
    .addStringOption(o => o.setName('hadiah').setDescription('Nama hadiah').setRequired(true))
    .addIntegerOption(o => o.setName('durasi').setDescription('Durasi (menit)').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addStringOption(o => o.setName('emoji').setDescription('Emoji react untuk ikut').setRequired(true))
    .addStringOption(o => o.setName('klaim').setDescription('Cara klaim hadiah — contoh: DM admin, hadir di VC, dll').setRequired(true))
    .addUserOption(o => o.setName('admin').setDescription('Tag admin penyelenggara (default: kamu sendiri)'))
    .addIntegerOption(o => o.setName('pemenang').setDescription('Jumlah pemenang (default:1)').setMinValue(1).setMaxValue(10))
    .addChannelOption(o => o.setName('channel').setDescription('Channel giveaway'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('🛑 Akhiri giveaway lebih awal')
    .addStringOption(o => o.setName('message_id').setDescription('ID pesan giveaway').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('giveaway-reroll')
    .setDescription('🔄 Pilih ulang pemenang giveaway')
    .addStringOption(o => o.setName('message_id').setDescription('ID pesan giveaway').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  // ── ROLE ──
  new SlashCommandBuilder().setName('giverole').setDescription('➕ Beri role ke member')
    .addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true))
    .addRoleOption(o=>o.setName('role').setDescription('Role').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder().setName('removerole').setDescription('➖ Hapus role dari member')
    .addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true))
    .addRoleOption(o=>o.setName('role').setDescription('Role').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  // ── MODERASI ──
  new SlashCommandBuilder().setName('kick').setDescription('👢 Kick member')
    .addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true))
    .addStringOption(o=>o.setName('alasan').setDescription('Alasan'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder().setName('ban').setDescription('🔨 Ban member')
    .addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true))
    .addStringOption(o=>o.setName('alasan').setDescription('Alasan'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder().setName('timeout').setDescription('⏰ Timeout member')
    .addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true))
    .addIntegerOption(o=>o.setName('menit').setDescription('Durasi menit').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o=>o.setName('alasan').setDescription('Alasan'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder().setName('clear').setDescription('🧹 Hapus pesan')
    .addIntegerOption(o=>o.setName('jumlah').setDescription('Jumlah (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // ── INFO ──
  new SlashCommandBuilder().setName('serverinfo').setDescription('🏠 Info server'),
  new SlashCommandBuilder().setName('userinfo').setDescription('👤 Info user')
    .addUserOption(o=>o.setName('user').setDescription('User')),
  new SlashCommandBuilder().setName('ping').setDescription('🏓 Cek latency'),
  new SlashCommandBuilder().setName('leaderboard').setDescription('🏆 Leaderboard trivia'),
  new SlashCommandBuilder().setName('poin').setDescription('💎 Lihat poin kamu'),

  // ── GAMES ──
  new SlashCommandBuilder().setName('coinflip').setDescription('🪙 Lempar koin!'),
  new SlashCommandBuilder().setName('rps').setDescription('✊ Batu Gunting Kertas!')
    .addStringOption(o=>o.setName('pilihan').setDescription('Pilihan').setRequired(true).addChoices(
      {name:'🪨 Batu',value:'batu'},{name:'✂️ Gunting',value:'gunting'},{name:'📄 Kertas',value:'kertas'},
    )),
  new SlashCommandBuilder().setName('trivia').setDescription('🧠 Main trivia!'),
  new SlashCommandBuilder().setName('8ball').setDescription('🎱 Tanya bola ajaib!')
    .addStringOption(o=>o.setName('pertanyaan').setDescription('Pertanyaan').setRequired(true)),
  new SlashCommandBuilder().setName('tebakangka').setDescription('🔢 Tebak angka 1-100!')
    .addIntegerOption(o=>o.setName('tebakan').setDescription('Tebakan').setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName('help').setDescription('📖 Semua perintah bot'),
].map(c => c.toJSON());

// ─── Register Commands ───
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  try {
    console.log('[CMD] Mendaftarkan commands...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('[CMD] ✅ Commands terdaftar!');
  } catch (err) { console.error('[CMD] ❌', err); }
}

// ─── Ready ───
client.once(Events.ClientReady, async () => {
  console.log(`\n✅ ${client.user.tag} ONLINE! (${client.guilds.cache.size} servers)\n`);
  client.user.setActivity('YTTA Community 🎮', { type: 0 });
  await registerCommands();
});

// ─── Member Join ───
client.on(Events.GuildMemberAdd, async (member) => {
  const cfg = getConfig(member.guild.id);
  const welcomeCh = cfg.welcomeChannelId
    ? member.guild.channels.cache.get(cfg.welcomeChannelId)
    : member.guild.systemChannel;
  if (!welcomeCh) return;

  if (cfg.welcomeCard) {
    // ══ MODE KARTU DINAMIS ══
    try {
      const buffer = await generateWelcomeCard(member, cfg);
      const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });

      const pesanTeks = cfg.welcomeMsg
        ? formatMsg(cfg.welcomeMsg, member)
        : `🎉 Selamat datang di **${member.guild.name}**, ${member}!\nKamu adalah member ke-**${member.guild.memberCount}**!`;

      await welcomeCh.send({ content: pesanTeks, files: [attachment] });
    } catch (err) {
      console.error('[WELCOME CARD]', err);
      // Fallback ke embed biasa kalau error
      await welcomeCh.send({ embeds: [buildWelcomeEmbed(member, cfg)] }).catch(()=>{});
    }
  } else {
    // ══ MODE EMBED BIASA ══
    await welcomeCh.send({ embeds: [buildWelcomeEmbed(member, cfg)] }).catch(()=>{});
  }

  await sendLog(member.guild, `📥 **${member.user.tag}** bergabung. (Total: ${member.guild.memberCount})`);
});

function buildWelcomeEmbed(member, cfg) {
  const pesanTeks = cfg.welcomeMsg
    ? formatMsg(cfg.welcomeMsg, member)
    : `Halo ${member}, selamat datang di **${member.guild.name}**! 🎊\n\nKamu adalah member ke-**${member.guild.memberCount}**!\nSilakan baca rules dan ambil role ya~`;

  const embed = new EmbedBuilder()
    .setTitle('🎉 Selamat Datang!')
    .setDescription(pesanTeks)
    .setColor(COLORS.success)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '👤 Username', value: member.user.tag, inline: true },
      { name: '👥 Member ke', value: `${member.guild.memberCount}`, inline: true },
      { name: '📅 Akun Dibuat', value: `<t:${Math.floor(member.user.createdTimestamp/1000)}:R>`, inline: true },
    )
    .setTimestamp().setFooter({ text: member.guild.name });

  if (cfg.welcomeImg) embed.setImage(cfg.welcomeImg);
  return embed;
}

// ─── Member Leave ───
client.on(Events.GuildMemberRemove, async (member) => {
  const cfg = getConfig(member.guild.id);
  const goodbyeCh = cfg.goodbyeChannelId
    ? member.guild.channels.cache.get(cfg.goodbyeChannelId)
    : null;

  if (goodbyeCh) {
    const pesanTeks = cfg.goodbyeMsg
      ? formatMsg(cfg.goodbyeMsg, member)
      : `**${member.user.tag}** telah meninggalkan server.\nSemoga kita bisa bertemu lagi! 🙏`;

    const embed = new EmbedBuilder()
      .setTitle('👋 Sampai Jumpa!')
      .setDescription(pesanTeks)
      .setColor(COLORS.danger)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Username', value: member.user.tag, inline: true },
        { name: '👥 Sisa Member', value: `${member.guild.memberCount}`, inline: true },
      )
      .setTimestamp().setFooter({ text: member.guild.name });

    if (cfg.goodbyeImg) embed.setImage(cfg.goodbyeImg);
    goodbyeCh.send({ embeds: [embed] }).catch(()=>{});
  }

  await sendLog(member.guild, `📤 **${member.user.tag}** keluar. (Total: ${member.guild.memberCount})`);
});

// ─── Reactions ───
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
  const key = `${reaction.message.id}_${reaction.emoji.name}`;
  if (reactionRoleMessages.has(key)) {
    const guild  = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(()=>null);
    if (member) {
      const role = guild.roles.cache.get(reactionRoleMessages.get(key));
      if (role) { await member.roles.add(role).catch(()=>{}); user.send(`✅ Role **${role.name}** diberikan di **${guild.name}**!`).catch(()=>{}); }
    }
  }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
  const key = `${reaction.message.id}_${reaction.emoji.name}`;
  if (reactionRoleMessages.has(key)) {
    const guild  = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(()=>null);
    if (member) {
      const role = guild.roles.cache.get(reactionRoleMessages.get(key));
      if (role) { await member.roles.remove(role).catch(()=>{}); user.send(`❌ Role **${role.name}** dihapus dari **${guild.name}**!`).catch(()=>{}); }
    }
  }
});

// ─── Interactions ───
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('trivia_')) await handleTriviaButton(interaction);
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  const { commandName, options, guild, member, channel } = interaction;

  try {
    switch (commandName) {

      case 'setup-announcement': {
        const ch = options.getChannel('channel');
        getConfig(guild.id).announcementChannelId = ch.id;
        await interaction.reply({ embeds: [makeEmbed('✅ Setup Berhasil!', `Channel announcement → ${ch}`, COLORS.success)], ephemeral: true });
        break;
      }

      case 'setup-welcome': {
        const ch      = options.getChannel('channel');
        const kartu   = options.getBoolean('kartu');
        const bg      = options.getString('background');
        const warna   = options.getString('warna');
        const pesan   = options.getString('pesan');
        const gambar  = options.getString('gambar');
        const cfg     = getConfig(guild.id);

        cfg.welcomeChannelId = ch.id;
        if (kartu !== null)  cfg.welcomeCard    = kartu;
        if (bg)              cfg.welcomeCardBg  = bg;
        if (warna)           cfg.welcomeCardColor = warna;
        if (pesan)           cfg.welcomeMsg     = pesan;
        if (gambar)          cfg.welcomeImg     = gambar;

        const modeText = cfg.welcomeCard
          ? `🖼️ **Mode: Welcome Card Dinamis** (foto profil member otomatis!)`
          : `📋 **Mode: Embed Biasa**`;

        await interaction.reply({ embeds: [makeEmbed('✅ Setup Welcome Berhasil!',
          `Channel → ${ch}\n${modeText}\n` +
          (cfg.welcomeCardBg ? `Background → URL tersimpan ✅\n` : '') +
          (cfg.welcomeCardColor ? `Warna → \`${cfg.welcomeCardColor}\`\n` : '') +
          `\n**Cara pakai background foto sendiri:**\n` +
          `1. Upload foto di channel Discord\n` +
          `2. Tekan lama → Copy Link\n` +
          `3. Paste di kolom \`background\`\n\n` +
          `**Placeholder pesan:** \`{user}\` \`{username}\` \`{server}\` \`{count}\``,
          COLORS.success)], ephemeral: true });
        break;
      }

      case 'setup-goodbye': {
        const ch = options.getChannel('channel'), pesan = options.getString('pesan'), gambar = options.getString('gambar');
        const cfg = getConfig(guild.id);
        cfg.goodbyeChannelId = ch.id;
        if (pesan)  cfg.goodbyeMsg = pesan;
        if (gambar) cfg.goodbyeImg = gambar;
        await interaction.reply({ embeds: [makeEmbed('✅ Setup Goodbye Berhasil!', `Channel → ${ch}`, COLORS.success)], ephemeral: true });
        break;
      }

      case 'setup-log': {
        const ch = options.getChannel('channel');
        getConfig(guild.id).logChannelId = ch.id;
        await interaction.reply({ embeds: [makeEmbed('✅ Setup Log!', `Channel log → ${ch}`, COLORS.success)], ephemeral: true });
        break;
      }

      case 'announce': {
        const cfg = getConfig(guild.id);
        if (!cfg.announcementChannelId) return interaction.reply({ embeds: [makeEmbed('❌', 'Jalankan `/setup-announcement` dulu!', COLORS.danger)], ephemeral: true });
        const annCh = guild.channels.cache.get(cfg.announcementChannelId);
        if (!annCh) return interaction.reply({ embeds: [makeEmbed('❌', 'Channel tidak ditemukan!', COLORS.danger)], ephemeral: true });

        const judul = options.getString('judul'), pesan = options.getString('pesan').replace(/\\n/g,'\n');
        const wKey  = options.getString('warna') || 'ytta', pingOpt = options.getString('ping') || 'none';
        const gambar = options.getString('gambar');

        const embed = new EmbedBuilder().setTitle(`📢 ${judul}`).setDescription(pesan)
          .setColor(COLORS[wKey]||COLORS.ytta).setTimestamp()
          .setFooter({ text: `Oleh ${member.user.tag} | YTTA Community` });
        if (gambar) embed.setImage(gambar);

        const ping = pingOpt==='everyone'?'@everyone\n':pingOpt==='here'?'@here\n':null;
        const sent = await annCh.send({ content: ping, embeds: [embed] });
        if (annCh.type === ChannelType.GuildAnnouncement && sent?.crosspostable) await sent.crosspost().catch(()=>{});
        await interaction.reply({ embeds: [makeEmbed('✅ Terkirim!', `Pengumuman dikirim ke ${annCh}!`, COLORS.success)], ephemeral: true });
        break;
      }

      case 'setup-roles': {
        const judul = options.getString('judul'), desk = options.getString('deskripsi');
        const roles=[], emojis=[];
        for (let i=1;i<=4;i++) { const r=options.getRole(`role${i}`),e=options.getString(`emoji${i}`); if(r&&e){roles.push(r);emojis.push(e);} }
        if (roles.length===0) return interaction.reply({ embeds: [makeEmbed('❌','Minimal 1 role!',COLORS.danger)], ephemeral:true });
        let desc = `${desk}\n\n`;
        roles.forEach((r,i)=>{ desc+=`${emojis[i]} → **${r.name}**\n`; });
        desc += '\n*React untuk dapat role!*';
        const msg = await channel.send({ embeds: [makeEmbed(`🎭 ${judul}`, desc, COLORS.ytta)] });
        for (let i=0;i<roles.length;i++) { await msg.react(emojis[i]).catch(()=>{}); reactionRoleMessages.set(`${msg.id}_${emojis[i]}`, roles[i].id); }
        await interaction.reply({ embeds: [makeEmbed('✅ Reaction Role Dibuat!', `Berhasil di ${channel}!`, COLORS.success)], ephemeral:true });
        break;
      }

      case 'giveaway-start': {
        const hadiah=options.getString('hadiah'), durasi=options.getInteger('durasi');
        const emoji=options.getString('emoji'), jumlahMenang=options.getInteger('pemenang')||1;
        const klaim=options.getString('klaim');
        const adminUser=options.getMember('admin');
        const adminId = adminUser ? adminUser.id : member.id;
        const targetCh=options.getChannel('channel')||channel;
        const endTime = Date.now() + durasi*60*1000;
        const gdata = {
          prize:hadiah, endTime, channelId:targetCh.id, guildId:guild.id,
          emoji, hostId:member.id, adminId, klaim,
          winnersCount:jumlahMenang, timeout:null
        };
        const msg = await targetCh.send({ embeds: [buildGiveawayEmbed(gdata,false)] });
        await msg.react(emoji).catch(()=>{});
        gdata.timeout = setTimeout(()=>endGiveaway(msg.id,guild), durasi*60*1000);
        gdata.messageId = msg.id;
        activeGiveaways.set(msg.id, gdata);
        await interaction.reply({ embeds: [makeEmbed('🎉 Giveaway Dimulai!',
          `**Hadiah:** ${hadiah}\n**Channel:** ${targetCh}\n**Durasi:** ${durasi} menit\n` +
          `**Pemenang:** ${jumlahMenang}\n**Penyelenggara:** <@${adminId}>\n**Cara Klaim:** ${klaim}\n\n` +
          `**ID Pesan:** \`${msg.id}\``,
          COLORS.gold)], ephemeral:true });
        break;
      }

      case 'giveaway-end': {
        const msgId = options.getString('message_id');
        if (!activeGiveaways.has(msgId)) return interaction.reply({ embeds: [makeEmbed('❌','Giveaway tidak ditemukan!',COLORS.danger)], ephemeral:true });
        await interaction.reply({ embeds: [makeEmbed('⏳','Menghitung pemenang...',COLORS.info)], ephemeral:true });
        await endGiveaway(msgId, guild);
        break;
      }

      case 'giveaway-reroll': {
        const msgId = options.getString('message_id');
        const gdata = endedGiveaways.get(msgId);
        if (!gdata) return interaction.reply({ embeds: [makeEmbed('❌','Giveaway tidak ditemukan!',COLORS.danger)], ephemeral:true });
        try {
          const ch  = guild.channels.cache.get(gdata.channelId);
          const msg = await ch.messages.fetch(msgId).catch(()=>null);
          if (!msg) return interaction.reply({ embeds: [makeEmbed('❌','Pesan tidak ditemukan!',COLORS.danger)], ephemeral:true });
          const reaction = msg.reactions.cache.get(gdata.emoji);
          const users    = await reaction.users.fetch();
          const eligible = users.filter(u=>!u.bot).map(u=>u);
          if (eligible.length===0) return interaction.reply({ embeds: [makeEmbed('❌','Tidak ada peserta!',COLORS.danger)], ephemeral:true });
          const count=Math.min(gdata.winnersCount,eligible.length), winners=[], pool=[...eligible];
          for(let i=0;i<count;i++){const idx=Math.floor(Math.random()*pool.length);winners.push(pool.splice(idx,1)[0]);}
          const wMentions = winners.map(u=>`<@${u.id}>`).join(', ');
          const adminMention = `<@${gdata.adminId || gdata.hostId}>`;
          const klaimText = gdata.klaim || `Hubungi ${adminMention}`;
          await ch.send({ content:wMentions, embeds:[new EmbedBuilder().setTitle('🔄 Reroll Giveaway!')
            .setDescription(
              `**Hadiah:** 🎁 **${gdata.prize}**\n\n` +
              `🏆 **Pemenang Baru:**\n${wMentions}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `📦 **Cara Klaim:** ${klaimText}\n` +
              `👤 **Penyelenggara:** ${adminMention}`
            )
            .setColor(COLORS.gold).setTimestamp()] });
          await interaction.reply({ embeds:[makeEmbed('✅ Reroll Berhasil!',`Pemenang: ${wMentions}`,COLORS.success)], ephemeral:true });
        } catch(err) { await interaction.reply({ embeds:[makeEmbed('❌',err.message,COLORS.danger)], ephemeral:true }); }
        break;
      }

      case 'giverole': {
        const t=options.getMember('user'),r=options.getRole('role');
        if(t.roles.cache.has(r.id)) return interaction.reply({embeds:[makeEmbed('⚠️',`${t} sudah punya role ini!`,COLORS.warning)],ephemeral:true});
        await t.roles.add(r);
        await interaction.reply({embeds:[makeEmbed('✅ Role Diberikan!',`**${r.name}** → ${t}`,COLORS.success)]});
        break;
      }

      case 'removerole': {
        const t=options.getMember('user'),r=options.getRole('role');
        if(!t.roles.cache.has(r.id)) return interaction.reply({embeds:[makeEmbed('⚠️',`${t} tidak punya role ini!`,COLORS.warning)],ephemeral:true});
        await t.roles.remove(r);
        await interaction.reply({embeds:[makeEmbed('✅ Role Dihapus!',`**${r.name}** dihapus dari ${t}`,COLORS.success)]});
        break;
      }

      case 'kick': {
        const t=options.getMember('user'),a=options.getString('alasan')||'Tidak ada alasan';
        if(!t.kickable) return interaction.reply({embeds:[makeEmbed('❌','Tidak bisa kick user ini!',COLORS.danger)],ephemeral:true});
        await t.kick(a);
        await interaction.reply({embeds:[makeEmbed('👢 di-Kick',`**${t.user.tag}**\n**Alasan:** ${a}`,COLORS.warning)]});
        break;
      }

      case 'ban': {
        const t=options.getMember('user'),a=options.getString('alasan')||'Tidak ada alasan';
        if(!t.bannable) return interaction.reply({embeds:[makeEmbed('❌','Tidak bisa ban user ini!',COLORS.danger)],ephemeral:true});
        await t.ban({reason:a});
        await interaction.reply({embeds:[makeEmbed('🔨 di-Ban',`**${t.user.tag}**\n**Alasan:** ${a}`,COLORS.danger)]});
        break;
      }

      case 'timeout': {
        const t=options.getMember('user'),m=options.getInteger('menit'),a=options.getString('alasan')||'Tidak ada alasan';
        await t.timeout(m*60*1000,a);
        await interaction.reply({embeds:[makeEmbed('⏰ Timeout',`**${t.user.tag}** — **${m} menit**\n**Alasan:** ${a}`,COLORS.warning)]});
        break;
      }

      case 'clear': {
        const j=options.getInteger('jumlah');
        const d=await channel.bulkDelete(j,true).catch(()=>null);
        await interaction.reply({embeds:[makeEmbed('🧹 Dihapus',`Berhasil hapus **${d?.size||0}** pesan!`,COLORS.success)],ephemeral:true});
        break;
      }

      case 'serverinfo': {
        const owner=await guild.fetchOwner();
        await interaction.reply({embeds:[new EmbedBuilder().setTitle(`🏠 ${guild.name}`)
          .setThumbnail(guild.iconURL({dynamic:true})).setColor(COLORS.ytta)
          .addFields(
            {name:'👑 Owner',value:owner.user.tag,inline:true},
            {name:'👥 Member',value:`${guild.memberCount}`,inline:true},
            {name:'📅 Dibuat',value:`<t:${Math.floor(guild.createdTimestamp/1000)}:D>`,inline:true},
            {name:'💬 Channels',value:`${guild.channels.cache.size}`,inline:true},
            {name:'🎭 Roles',value:`${guild.roles.cache.size}`,inline:true},
            {name:'😀 Emojis',value:`${guild.emojis.cache.size}`,inline:true},
          ).setTimestamp().setFooter({text:'YTTA Community Bot'})]});
        break;
      }

      case 'userinfo': {
        const t=options.getMember('user')||member;
        const roles=t.roles.cache.filter(r=>r.id!==guild.id).map(r=>r.toString()).join(', ')||'Tidak ada';
        await interaction.reply({embeds:[new EmbedBuilder().setTitle(`👤 ${t.user.tag}`)
          .setThumbnail(t.user.displayAvatarURL({dynamic:true})).setColor(t.displayHexColor||COLORS.ytta)
          .addFields(
            {name:'🆔 ID',value:t.id,inline:true},
            {name:'📅 Dibuat',value:`<t:${Math.floor(t.user.createdTimestamp/1000)}:D>`,inline:true},
            {name:'📥 Bergabung',value:`<t:${Math.floor(t.joinedTimestamp/1000)}:D>`,inline:true},
            {name:'💎 Poin',value:`${getPoints(t.id)}`,inline:true},
            {name:'🎭 Roles',value:roles.length>1024?roles.substring(0,1020)+'...':roles},
          ).setTimestamp().setFooter({text:'YTTA Community Bot'})]});
        break;
      }

      case 'ping': {
        const s=Date.now(); await interaction.reply({content:'🏓'});
        await interaction.editReply({content:'',embeds:[makeEmbed('🏓 Pong!',`**Latency:** \`${Date.now()-s}ms\`\n**API:** \`${Math.round(client.ws.ping)}ms\``,COLORS.info)]});
        break;
      }

      case 'leaderboard': {
        if(userPoints.size===0) return interaction.reply({embeds:[makeEmbed('🏆','Belum ada yang main trivia!',COLORS.gold)]});
        const sorted=[...userPoints.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
        const medals=['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
        let desc='';
        for(let i=0;i<sorted.length;i++){const u=await client.users.fetch(sorted[i][0]).catch(()=>null);desc+=`${medals[i]} **${u?u.username:'Unknown'}** — \`${sorted[i][1]} poin\`\n`;}
        await interaction.reply({embeds:[makeEmbed('🏆 Leaderboard',desc,COLORS.gold)]});
        break;
      }

      case 'poin': {
        await interaction.reply({embeds:[makeEmbed('💎 Poin',`Kamu punya **${getPoints(member.id)} poin**! 🏆`,COLORS.gold)]});
        break;
      }

      case 'coinflip': {
        await interaction.reply({embeds:[makeEmbed('🪙 Coin Flip!',`# ${Math.random()<0.5?'👑 Heads':'🪙 Tails'}`,COLORS.gold)]});
        break;
      }

      case 'rps': {
        const pil=options.getString('pilihan');
        const items=['batu','gunting','kertas'], icons={batu:'🪨',gunting:'✂️',kertas:'📄'};
        const b=items[Math.floor(Math.random()*items.length)];
        let res,col;
        if(pil===b){res='🤝 **Seri!**';col=COLORS.warning;}
        else if((pil==='batu'&&b==='gunting')||(pil==='gunting'&&b==='kertas')||(pil==='kertas'&&b==='batu')){res='🎉 **Menang!**';col=COLORS.success;addPoints(member.id,2);}
        else{res='😢 **Kalah!**';col=COLORS.danger;}
        await interaction.reply({embeds:[makeEmbed('✊ RPS',`Kamu: **${icons[pil]} ${pil}**\nBot: **${icons[b]} ${b}**\n\n${res}`,col)]});
        break;
      }

      case 'trivia': {
        if(activeTrivia.has(member.id)) return interaction.reply({embeds:[makeEmbed('⚠️','Masih ada trivia aktif!',COLORS.warning)],ephemeral:true});
        const q=TRIVIA[Math.floor(Math.random()*TRIVIA.length)];
        const shuffled=[...q.opts].sort(()=>Math.random()-0.5);
        const buttons=shuffled.map((opt,i)=>new ButtonBuilder().setCustomId(`trivia_${member.id}_${opt===q.a?'correct':'wrong'}_${i}`).setLabel(opt).setStyle(ButtonStyle.Primary));
        const row=new ActionRowBuilder().addComponents(buttons);
        const timeout=setTimeout(()=>activeTrivia.delete(member.id),30000);
        activeTrivia.set(member.id,{answer:q.a,timeout});
        await interaction.reply({embeds:[makeEmbed('🧠 Trivia!',`**${q.q}**\n\nJawab dalam **30 detik**! *(Benar = +5 poin)*`,COLORS.info)],components:[row]});
        break;
      }

      case '8ball': {
        const p=options.getString('pertanyaan');
        await interaction.reply({embeds:[makeEmbed('🎱 8-Ball',`**Q:** ${p}\n\n**A:** ${BALL_ANSWERS[Math.floor(Math.random()*BALL_ANSWERS.length)]}`,COLORS.ytta)]});
        break;
      }

      case 'tebakangka': {
        const t=options.getInteger('tebakan'), r=Math.floor(Math.random()*100)+1;
        if(t===r){addPoints(member.id,10);await interaction.reply({embeds:[makeEmbed('🎊 BENAR!',`Tebakan: **${t}** | Rahasia: **${r}**\n\n🎉 **+10 poin! Total: ${getPoints(member.id)} poin**`,COLORS.success)]});}
        else{const h=t<r?'📈 Terlalu kecil!':'📉 Terlalu besar!';await interaction.reply({embeds:[makeEmbed('❌ Salah!',`Tebakan: **${t}** | Rahasia: **${r}**\n\n${h}`,COLORS.danger)]});}
        break;
      }

      case 'help': {
        await interaction.reply({embeds:[new EmbedBuilder()
          .setTitle('📖 YTTA Community Bot v3.0')
          .setColor(COLORS.ytta).setThumbnail(client.user.displayAvatarURL())
          .addFields(
            {name:'⚙️ Setup & Admin',value:'`/setup-announcement` `/setup-welcome` `/setup-goodbye` `/setup-log` `/setup-roles` `/announce`'},
            {name:'🎉 Giveaway',value:'`/giveaway-start` `/giveaway-end` `/giveaway-reroll`'},
            {name:'🎭 Role',value:'`/giverole` `/removerole`'},
            {name:'🛡️ Moderasi',value:'`/kick` `/ban` `/timeout` `/clear`'},
            {name:'🎮 Mini Games',value:'`/coinflip` `/rps` `/trivia` `/tebakangka` `/8ball`'},
            {name:'📊 Info',value:'`/serverinfo` `/userinfo` `/ping` `/poin` `/leaderboard`'},
            {name:'🖼️ Welcome Card Setup',value:
              '`/setup-welcome channel:#ch kartu:True background:[url foto] warna:#22c55e`\n' +
              'Foto profil member otomatis muncul di kartu!'},
          )
          .setTimestamp().setFooter({text:'YTTA Community Bot v3.0 • Made with ❤️'})]});
        break;
      }
    }
  } catch (err) {
    console.error(`[ERR] ${commandName}:`, err);
    const e=makeEmbed('❌ Error',err.message,COLORS.danger);
    if(interaction.replied||interaction.deferred) await interaction.followUp({embeds:[e],ephemeral:true}).catch(()=>{});
    else await interaction.reply({embeds:[e],ephemeral:true}).catch(()=>{});
  }
});

// ─── Trivia Button ───
async function handleTriviaButton(interaction) {
  const parts=interaction.customId.split('_');
  // format: trivia_userId_correct/wrong_index
  const userId=parts[1], isCorrect=parts[2]==='correct';
  if(interaction.user.id!==userId) return interaction.reply({content:'❌ Bukan trivia kamu!',ephemeral:true});
  const game=activeTrivia.get(userId);
  if(!game) return interaction.reply({content:'⏰ Waktu habis!',ephemeral:true});
  clearTimeout(game.timeout); activeTrivia.delete(userId);
  if(isCorrect){addPoints(userId,5);await interaction.update({embeds:[makeEmbed('✅ BENAR!',`🎉 +5 poin! Total: **${getPoints(userId)} poin**`,COLORS.success)],components:[]});}
  else{await interaction.update({embeds:[makeEmbed('❌ Salah!',`Jawaban benar: **${game.answer}**`,COLORS.danger)],components:[]});}
}

// ─── Login ───
client.login(process.env.BOT_TOKEN);
