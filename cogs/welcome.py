import discord
from discord.ext import commands
import json

class Welcome(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member):
        with open("config.json", "r") as f:
            config = json.load(f)
        channel_id = config.get("welcome_channel_id")
        if not channel_id:
            return
        channel = member.guild.get_channel(channel_id)
        if channel:
            msg = config["welcome_message"].format(member=member, guild=member.guild)
            await channel.send(msg)

async def setup(bot):
    await bot.add_cog(Welcome(bot))
