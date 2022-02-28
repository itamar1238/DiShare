require('dotenv').config();
const mongoose = require('mongoose');
const discord = require('discord.js');
const { Permissions } = require('discord.js');
const prefix = process.env.PREFIX;
const guildSchema = require('./models/guild')
mongoose.connect(process.env.MONGO_URI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (error) => error
      ? console.log('Failed to connect to database')
      : console.log('Connected to database'));

const client = new discord.Client({intents: ['GUILDS','GUILD_INVITES','GUILD_MESSAGES','GUILD_MESSAGE_REACTIONS','GUILD_PRESENCES']});

client.once('ready', () => {
    console.log('Bot is ready');
})

client.on('messageCreate', async (message) => {
    if (message.content == prefix + 'help') {
        try {
            await message.channel.send(`${prefix}invite: `+'``Sets the current invite in the site. This must be done at least once for the server to show up on the site!``\n' + `${prefix}bump: `+'``Bumps the server on the site!``')
        } catch {

        }
    }
    if (message.content == prefix + 'invite') {
        if (message.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
            await message.channel.createInvite({ unique: true, temporary: false }).then(async invite => {
                // console.log(invite.code)
                // invite.code
                let gs = await guildSchema.findOne({ guildID: `${message.channel.guild.id}` })
                if (!gs) {
                    await message.channel.send('You must first enable your server to the site using the dashboard!')
                    return
                } else {
                    await guildSchema.findOneAndUpdate({ guildID: `${message.channel.guild.id}` }, {inv: `https://discord.gg/${invite.code}`});
                    try {
                        await message.channel.send(`${message.author}, Your invite has successfully been set!`)
                    } catch {

                    }
                }
            });    
        } else {
            try {
                message.channel.send(`${message.author}, You must have the MANAGE_GUILD permission to use this command!`)
            } catch {

            }
        }
    }

    if (message.content == prefix + 'bump') {
        var gs = await guildSchema.findOne({ guildID: message.guild.id })
        if (!gs) {
            try {
                await message.channel.send('You must first enable the server on the dashboard!')
            } catch {

            }
        } else {
            try {
                var today = new Date();
                var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
                var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                var dateTime = date+' '+time;
                await guildSchema.findOneAndUpdate({ guildID: message.guild.id }, {lastBump: new Date()})
                await message.channel.send('Bumped!')
            } catch {
                
            }
            
        }
    }
})

client.login(`${process.env.TOKEN}`)

module.exports = client;

require('./index');