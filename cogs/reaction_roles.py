import discord
from discord.ext import commands

class ReactionRoles(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="reactionrole")
    @commands.has_permissions(administrator=True)
    async def create_rr(self, ctx, channel: discord.TextChannel, role: discord.Role, emoji: str):
        """Buat pesan reaction role. Contoh: !reactionrole #channel @Role 🎮"""
        msg = await channel.send(f"Reaksi {emoji} untuk mendapatkan role **{role.name}**")
        await msg.add_reaction(emoji)

        # Simpan mapping ke database (di sini pakai dict sederhana di memory)
        if not hasattr(self.bot, "reaction_map"):
            self.bot.reaction_map = {}
        self.bot.reaction_map[msg.id] = {"role": role.id, "emoji": emoji}

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        if not hasattr(self.bot, "reaction_map"):
            return
        mapping = self.bot.reaction_map.get(payload.message_id)
        if mapping is None:
            return
        if str(payload.emoji) != mapping["emoji"]:
            return
        guild = self.bot.get_guild(payload.guild_id)
        role = guild.get_role(mapping["role"])
        member = guild.get_member(payload.user_id)
        if member and role:
            await member.add_roles(role)

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload):
        if not hasattr(self.bot, "reaction_map"):
            return
        mapping = self.bot.reaction_map.get(payload.message_id)
        if mapping is None:
            return
        if str(payload.emoji) != mapping["emoji"]:
            return
        guild = self.bot.get_guild(payload.guild_id)
        role = guild.get_role(mapping["role"])
        member = guild.get_member(payload.user_id)
        if member and role:
            await member.remove_roles(role)

async def setup(bot):
    await bot.add_cog(ReactionRoles(bot))
