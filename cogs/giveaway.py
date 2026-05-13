import discord
from discord.ext import commands
import asyncio
import random

class Giveaway(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="giveaway")
    @commands.has_permissions(administrator=True)
    async def giveaway(self, ctx, waktu: int, *, hadiah: str):
        """Mulai giveaway dalam detik. Contoh: !giveaway 60 Nitro"""
        embed = discord.Embed(title="🎉 GIVEAWAY 🎉", description=f"Hadiah: **{hadiah}**\nWaktu: {waktu} detik\nReaksi 🎉 untuk ikut!", color=discord.Color.gold())
        msg = await ctx.send(embed=embed)
        await msg.add_reaction("🎉")
        await asyncio.sleep(waktu)
        # Ambil ulang pesan untuk dapat data reaksi terbaru
        msg = await ctx.channel.fetch_message(msg.id)
        reaction = discord.utils.get(msg.reactions, emoji="🎉")
        users = []
        async for user in reaction.users():
            if not user.bot:
                users.append(user)
        if not users:
            await ctx.send("Tidak ada yang ikut giveaway. 😔")
        else:
            winner = random.choice(users)
            await ctx.send(f"🎊 Selamat {winner.mention}, kamu memenangkan **{hadiah}**!")
            # Bisa tambahkan logika pengumuman ke channel khusus

async def setup(bot):
    await bot.add_cog(Giveaway(bot))
