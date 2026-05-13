import discord
from discord.ext import commands
import json

class Announcement(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="announce")
    @commands.has_permissions(administrator=True)
    async def announce(self, ctx, *, message: str):
        with open("config.json", "r") as f:
            config = json.load(f)
        channel_id = config.get("announcement_channel_id")
        if not channel_id:
            return await ctx.send("❌ Channel pengumuman belum diatur. Gunakan `!setannounce`.")
        channel = self.bot.get_channel(channel_id)
        if channel:
            embed = discord.Embed(title="📢 Pengumuman", description=message, color=discord.Color.blue())
            embed.set_footer(text=f"Dikirim oleh {ctx.author}", icon_url=ctx.author.display_avatar.url)
            await channel.send(embed=embed)
            await ctx.send("✅ Pengumuman terkirim!")
        else:
            await ctx.send("❌ Channel tidak ditemukan.")

async def setup(bot):
    await bot.add_cog(Announcement(bot))
