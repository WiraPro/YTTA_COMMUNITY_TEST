# 🎮 YTTA Community Bot

Bot Discord resmi untuk server **YTTA Community** — dilengkapi fitur announcement, reaction roles, moderasi, dan mini games!

---

## ✨ Fitur Lengkap

| Kategori | Fitur |
|---|---|
| 📢 Announcement | Kirim pengumuman resmi dengan embed cantik |
| 🎭 Reaction Roles | Member ambil role sendiri via reaksi emoji |
| 🛡️ Moderasi | Kick, Ban, Timeout, Clear pesan |
| 🎮 Mini Games | Coinflip, RPS, Trivia, Tebak Angka, 8Ball |
| 📊 Info | ServerInfo, UserInfo, Leaderboard Poin |
| 🌐 Hosting | Siap deploy di Railway (gratis!) |

---

## 🚀 Cara Setup (Bisa di HP!)

### Langkah 1 — Buat Bot di Discord

1. Buka **[Discord Developer Portal](https://discord.com/developers/applications)**
2. Klik **"New Application"** → beri nama `YTTA Community Bot`
3. Masuk tab **Bot** → klik **"Add Bot"**
4. Di bagian **Privileged Gateway Intents**, aktifkan:
   - ✅ `PRESENCE INTENT`
   - ✅ `SERVER MEMBERS INTENT`
   - ✅ `MESSAGE CONTENT INTENT`
5. Klik **"Save Changes"**
6. Klik **"Reset Token"** → copy token-nya (**JANGAN SHARE!**)

### Langkah 2 — Invite Bot ke Server

1. Masih di Developer Portal → tab **OAuth2 → URL Generator**
2. Centang **Scopes:** `bot`, `applications.commands`
3. Centang **Bot Permissions:**
   - `Administrator` (atau pilih manual yang kamu butuhkan)
4. Copy URL yang dibuat → buka di browser → invite ke server

### Langkah 3 — Upload ke GitHub

1. Buka **[github.com](https://github.com)** → login
2. Klik **"+"** → **"New repository"**
3. Nama repo: `ytta-community-bot` → **Public** → **Create**
4. Upload semua file dari folder ini:
   - `index.js`
   - `package.json`
   - `railway.toml`
   - `.gitignore`
   - ⚠️ **JANGAN upload `.env`** (berisi token rahasia!)

> 💡 **Di HP:** Gunakan aplikasi **GitHub Mobile** atau buka github.com di browser HP → Upload files

### Langkah 4 — Deploy ke Railway (GRATIS!)

1. Buka **[railway.app](https://railway.app)** → login dengan GitHub
2. Klik **"New Project"** → **"Deploy from GitHub repo"**
3. Pilih repo `ytta-community-bot`
4. Setelah project dibuat, klik **"Variables"** (tab di atas)
5. Tambahkan variabel berikut:

   | Variable | Value |
   |---|---|
   | `BOT_TOKEN` | Token bot kamu dari Developer Portal |
   | `CLIENT_ID` | Application ID dari Developer Portal |

6. Railway otomatis akan deploy bot kamu!
7. Cek tab **"Deployments"** — tunggu sampai status **"Success"** ✅

> 💡 **Railway Free Tier:** Gratis $5/bulan credit, cukup untuk bot Discord berjalan 24/7!

---

## ⚙️ Cara Pakai Bot (Pertama Kali)

Setelah bot online di server, jalankan command berikut sebagai Admin:

```
1. /setup-announcement #channel-pengumuman
   → Set channel untuk pengumuman resmi

2. /setup-log #channel-log  
   → Set channel untuk log aktivitas (opsional)

3. /setup-roles "Judul" "Deskripsi" role1 emoji1 role2 emoji2
   → Buat pesan reaction role
```

---

## 📋 Daftar Command

### ⚙️ Admin
| Command | Fungsi |
|---|---|
| `/setup-announcement` | Set channel announcement |
| `/setup-log` | Set channel log |
| `/announce` | Kirim pengumuman resmi |
| `/setup-roles` | Buat reaction role |

### 🎭 Role Management
| Command | Fungsi |
|---|---|
| `/giverole @user @role` | Beri role ke member |
| `/removerole @user @role` | Hapus role dari member |

### 🛡️ Moderasi
| Command | Fungsi |
|---|---|
| `/kick @user` | Kick member |
| `/ban @user` | Ban member |
| `/timeout @user menit` | Timeout member |
| `/clear jumlah` | Hapus pesan (max 100) |

### 🎮 Mini Games
| Command | Fungsi |
|---|---|
| `/coinflip` | Lempar koin |
| `/rps batu/gunting/kertas` | Batu Gunting Kertas |
| `/trivia` | Kuis trivia (+5 poin) |
| `/tebakangka 1-100` | Tebak angka rahasia (+10 poin) |
| `/8ball pertanyaan` | Tanya bola ajaib |

### 📊 Info
| Command | Fungsi |
|---|---|
| `/serverinfo` | Info server |
| `/userinfo @user` | Info user |
| `/ping` | Cek latency bot |
| `/poin` | Lihat poin trivia kamu |
| `/leaderboard` | Ranking trivia |
| `/help` | Semua perintah |

---

## ❓ FAQ

**Q: Bot offline setelah beberapa jam?**  
A: Pastikan Railway punya credit yang cukup. Cek status di dashboard Railway.

**Q: Slash commands tidak muncul?**  
A: Tunggu maksimal 1 jam untuk propagasi global. Atau kick dan invite ulang bot.

**Q: Reaction role tidak berfungsi?**  
A: Pastikan role bot lebih tinggi dari role yang ingin diberikan di Server Settings → Roles.

**Q: Bisa tambah fitur?**  
A: Edit file `index.js` dan tambahkan command baru. Commit ke GitHub → Railway otomatis redeploy!

---

## 🔧 Development Lokal

```bash
# Clone repo
git clone https://github.com/USERNAME/ytta-community-bot

# Install dependencies  
npm install

# Copy env file
cp .env.example .env
# Edit .env dengan token bot kamu

# Jalankan bot
npm start
```

---

## 📞 Support

Butuh bantuan? Tanya di server **YTTA Community**! 🎮

---

*YTTA Community Bot v1.0.0 — Made with ❤️*
