import discord
from discord.ext import commands
import random

class Games(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="tebak")
    async def tebak_angka(self, ctx):
        angka = random.randint(1, 10)
        await ctx.send("Aku memilih angka 1-10. Coba tebak!")
        def check(m):
            return m.author == ctx.author and m.content.isdigit()
        try:
            msg = await self.bot.wait_for("message", check=check, timeout=15)
            if int(msg.content) == angka:
                await ctx.send("🎉 Benar!")
            else:
                await ctx.send(f"Salah! Angkanya {angka}.")
        except:
            await ctx.send("Waktu habis.")

    @commands.command(name="coinflip")
    async def coinflip(self, ctx):
        hasil = random.choice(["Angka", "Gambar"])
        await ctx.send(f"🪙 Koin: **{hasil}**")

    @commands.command(name="dadu")
    async def dadu(self, ctx):
        await ctx.send(f"🎲 Dadu: **{random.randint(1, 6)}**")

async def setup(bot):
    await bot.add_cog(Games(bot))
