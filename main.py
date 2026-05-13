import discord
from discord.ext import commands
import json
import os

intents = discord.Intents.all()
bot = commands.Bot(command_prefix=commands.when_mentioned_or("!"), intents=intents)

with open("config.json", "r") as f:
    config = json.load(f)

@bot.event
async def on_ready():
    print(f"Bot {bot.user} online!")
    await bot.load_extension("cogs.reaction_roles")
    await bot.load_extension("cogs.announcement")
    await bot.load_extension("cogs.giveaway")
    await bot.load_extension("cogs.welcome")
    await bot.load_extension("cogs.games")

@bot.command(name="setwelcome")
@commands.has_permissions(administrator=True)
async def set_welcome(ctx, channel: discord.TextChannel, *, message: str = None):
    config["welcome_channel_id"] = channel.id
    if message:
        config["welcome_message"] = message
    with open("config.json", "w") as f:
        json.dump(config, f, indent=4)
    await ctx.send(f"✅ Welcome diatur ke {channel.mention} dengan pesan:\n{config['welcome_message']}")

@bot.command(name="setannounce")
@commands.has_permissions(administrator=True)
async def set_announce(ctx, channel: discord.TextChannel):
    config["announcement_channel_id"] = channel.id
    with open("config.json", "w") as f:
        json.dump(config, f, indent=4)
    await ctx.send(f"✅ Channel pengumuman diset ke {channel.mention}")

bot.run(os.getenv("DISCORD_TOKEN"))
