require('dotenv').config()
const OAuthClient = require('disco-oauth');
const client = new OAuthClient(`${process.env.CLIENT_ID}`, `${process.env.CLIENT_SECRET}`);
client.setScopes('identify', 'guilds');
client.setRedirect('https://3000-itamar1238-serverlist-54jbn0lqyas.ws-us34.gitpod.io/login')

module.exports.client = client;