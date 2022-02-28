const { client } = require("./client");
const bot = require('../bot');

const sessions = new Map();

function get(key) {
    return sessions.get(key) ?? create(key);
}


async function create(key) {
    setTimeout(() => sessions.delete(key), 5 * 60 * 1000)
    await update(key);

    return sessions.get(key)
}

async function update(key) {
    return sessions
        .set(key, {
            authUser: await client.getUser(key),
            guilds: getManagableGuilds(await client.getGuilds(key))
        })
}

function getManagableGuilds(authGuilds) {
        // let guilds = await client.getGuilds(key);
        manageable = [];
        // console.log(Object.keys(guilds))
        for (let [key, value] of authGuilds) {
            // console.log(key + " = " + value.permissions);
            if (value.permissions.includes('MANAGE_GUILD')) {
                for (let [keyD, valueD] of bot.guilds.cache) {
                    if (`${valueD.id}` == `${value.id}`) {
                        manageable.push(valueD)
                    }
                }
                // if (bot.guilds.cache.get(`${value.id}`)) {
                //     manageable.push(value)
                // }
            }
        }
        // console.log(bot.guilds.cache)
        // console.log(JSON.stringify(manageable))
        // res.locals.guilds = 'Hi'
        // console.log(res.locals.guilds)
        return manageable;
}

async function getOwners(authGuilds) {
    owers = [];
    for (let [key, value] of authGuilds) {
        // console.log(key + " = " + value.permissions);
        if (value.permissions.includes('MANAGE_GUILD')) {
            for (let [keyD, valueD] of bot.guilds.cache) {
                if (`${valueD.id}` == `${value.id}`) {
                    owners.push({[valueD.id]: await valueD.fetchOwner()})
                }
            }
            // if (bot.guilds.cache.get(`${value.id}`)) {
            //     manageable.push(value)
            // }
        }
    }

    return owners;
}

module.exports.get = get;
module.exports.update = update;