const express = require('express');
const app = express();
const PORT = 3000;
const { client } = require('./modules/client')
const cookies = require('cookies');
const sessions = require('./modules/sessions');
const bot = require('./bot');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const mongoose =require('mongoose');
const guildSchema = require('./models/guild')
const discord = require('discord.js');
const Fuse = require('fuse.js')

const id = process.env.WEBHOOK_ID;
const token = process.env.WEBHOOK_TOKEN;

app.set('views', __dirname + '/views')
app.set('view engine', 'pug')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(express.static(`${__dirname}/assets`));
app.locals.basedir = `${__dirname}/assets`;
app.use(cookies.express(["keys"]));
async function isUser(req) {
    if (req.cookies.get('key')) {
        let user = await client.getUser(req.cookies.get('key'));
        if (user!=null) {
            return user;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

app.get('/', async (req,res) => {
    // console.log(await isUser(req))
    var last10 = await guildSchema.find().sort({ _id: -1 }).limit(10)
    var features = await guildSchema.find({ featured: true })
    var bumps = await guildSchema.find().sort({ lastBump: -1 }).limit(25)
    // var servers = JSON.stringify(await guildSchema.find())
    // console.log(await guildSchema.find())
    // console.log(bumps)
    // console.log(features)
    // console.log(last10)
    res.render('home', {
        user: await isUser(req),
        latest: last10,
        features: features,
        bot: bot,
        bumps: bumps,
        // servers: servers
    })
})

app.get('/categories', (req,res) => {
    res.send('To be worked on.')
})

app.get('/login/', async (req,res) => {
    let code = req.query.code;
    if(code==undefined) {
        res.send('OAuth verification failed due to an undefined code. Please contact us if this issue occurs again.')
    } else {
        let userkey = await client.getAccess(code).catch(console.error);
        res.cookies.set('key', userkey)

        // res.redirect('/user/');
        res.redirect('/')
    }
})

app.get('/user/', async (req,res) => {
    let key = req.cookies.get('key');
    if (key) {
        var valid = await client.checkValidity(key);
        if (valid.expired == true) {
            res.redirect('/signin')
        }
        let user = await client.getUser(key);
        if (user.id != "481186732075646992") {
            res.redirect('/')
        }
        if (!res.locals.user) {
            res.locals.user = user;
        }
        res.render('user', {
            name: user.username,
            id: user.id
        })
    } else {
        res.redirect(client.auth.link)
    }
})

app.get('/servers', async (req,res) => {
    let key = req.cookies.get('key');
    let manageable;
    if (key) {
        const { authUser } = await sessions.get(key);
        try {
            const { guilds } = await sessions.get(key);
            res.locals.guilds = guilds;
        } catch {
            // res.locals.guilds = res.locals.guilds ?? [];
        }
        res.render('servers', {
            guilds: res.locals.guilds,
            user: authUser
        })
    } else {
        res.redirect('/signin');
    }
})

app.get('/logout', (req,res) => {
    res.cookies.set('key', '')
    res.redirect('/')
})

app.get('/signin', (req,res) => {
    res.redirect(client.auth.link);
})

app.get('/auth-guild', async (req, res) => {
    const key = res.cookies.get('key')
    try {
        if (key) {
            await sessions.update(key);
        }
    } finally {
        if(!key) {
            res.redirect('/')
        } else {
            res.redirect('/servers');
        }
        
    }
})

app.get('/server/:id', async (req,res) => {
    let key = req.cookies.get('key');
    let manageable;
    let guilddd;
    if (key) {
        const { authUser } = await sessions.get(key);
        // const { owners } = await sessions.get(key);
        try {
            const { guilds } = await sessions.get(key);
            res.locals.guilds = guilds;
        } catch {
            // res.locals.guilds = res.locals.guilds ?? [];
        }
        try {
            if (!res.locals.guilds.find(g => g.id === req.params.id)) {
                res.redirect('/')
                return
            }
            // let guilddd;
            res.locals.guild = res.locals.guilds.find(g => g.id === req.params.id);
            guilddd = res.locals.guild
        } catch {

        }
        let gs = await guildSchema.findOne({ guildID: req.params.id })
        if (!gs) {
            gs = 'NONE'// await guildSchema.create({ guildID: req.params.id, title: guilddd.name, shortdescription: guilddd.name, longdescription: guilddd.name, inv: 'NONE' })
            // await gs.save()
        }
        res.render('show', {
            guilds: res.locals.guilds,
            user: authUser,
            guild: res.locals.guild,
            owner: await bot.guilds.cache.get(req.params.id).fetchOwner(),
            savedGuild: gs
        })
    } else {
        res.redirect('/signin');
    }
})

app.put('/server/:id/:module', async (req,res) => {
    try {
        const { id, module } = req.params;
        let savedGuild = await guildSchema.findOne({ guildID: req.params.id })
        if (!savedGuild) {
            var today = new Date();
            var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            var dateTime = date+' '+time;
            savedGuild = await guildSchema.create({ guildID: req.params.id, title: bot.guilds.cache.get(id).name, shortdescription: req.body.shortdescription, longdescription: req.body.longdescription, inv: 'NONE', reportID: id, featured: false, lastBump: new Date() })
            await savedGuild.save()
        } else {
            try {
                await guildSchema.findOneAndUpdate({ guildID: id }, {shortdescription: req.body.shortdescription, longdescription: req.body.longdescription})
            } catch {
                res.render('400')
            }
        }
        // savedGuild[module] = req.body;
        // await savedGuild.save();
        // console.log(req.body)
        res.redirect(`/server/${id}`)

    } catch {
        res.render('400')
    }
})

app.get('/reportComplete', (req,res) => {
    res.send('Your report has been sent and our team will look at it ASAP. Thanks for being an outstanding member of the community!')
})

app.get('/reportFailed', (req,res) => {
    res.send('Report Failed To Send')
})

app.get('/report/:id', async (req,res) => {
    // console.log(bot.guilds.cache.get(req.params.id))
    if (await isUser(req)) {
        res.render('report', {
            guild: bot.guilds.cache.get(req.params.id)
        })
    } else {
        res.redirect('/')
    }
})

app.put('/report/:id/report', async (req,res) => {
    const webhook = new discord.WebhookClient({id: id, token:token});
    if (req.body.report.length > 1500) {
        res.redirect('/reportFailed')
        return
    } else if (req.body.report === '') {
        res.redirect('/reportFailed')
        return
    }
    webhook.send(`Guild: ${bot.guilds.cache.get(req.params.id).name}\nGuildID: ${bot.guilds.cache.get(req.params.id).id}\nReport: ${req.body.report}`)
    .catch(console.error);

    res.redirect('/reportComplete')
})

app.get('/adminpanel', async (req,res) => {
    let key = req.cookies.get('key')
    if (key) {
        const { authUser } = await sessions.get(key);
        if (authUser.id != '481186732075646992') {
            res.redirect('/')
            return
        }
        res.render('admin', {
            user: authUser
        })
    } else {
        res.redirect('/signin')
        return
    }
})

app.put('/adminpanel/feature', async (req,res) => {
    let gs = await guildSchema.findOne({ guildID: req.body.guildID });
    if(!gs) {
        res.redirect('/')
        return
    } else {
        await guildSchema.findOneAndUpdate({ guildID: req.body.guildID }, {featured: true })
        res.redirect('/servers')
    }
})

app.put('/adminpanel/unfeature', async (req,res) => {
    let gs = await guildSchema.findOne({ guildID: req.body.guildID });
    if(!gs) {
        res.redirect('/')
        return
    } else {
        await guildSchema.findOneAndUpdate({ guildID: req.body.guildID }, {featured: false })
        res.redirect('/servers')
    }
})

app.get('/page/server', (req,res) => {
    res.redirect('/')
})

app.get('/page/server/:id', async (req,res) => {
    let key = req.cookies.get('key')
    let user = false;
    if (key) {
        const { authUser } = await sessions.get(key);
        user = authUser;
    }
    if (!bot.guilds.cache.get(req.params.id)) {
        res.render('404');
        return
    }
    res.render('server', {
        user: user,
        guild: bot.guilds.cache.get(req.params.id),
        savedGuild: await guildSchema.findOne({ guildID: req.params.id })
    })
})

app.get('/search', async (req,res) => {
    var query = req.query.q
    // var key = req.cookies.get('key')
    if (query == '') {
        res.redirect('/');
        return
    }
    
    // let { authUser } = await sessions.get(key)
    var servers = await guildSchema.find();
    const results = new Fuse(servers, {
        isCaseSensitive: false,
        keys: [
            { name: 'title', weight: 1 },
            { name: 'inv', weight: 0.5 }
        ]
    }).search(query).map(r => r.item);
    // console.log(results)
    res.render('search', {
        results: results,
        user: await isUser(req),
        bot: bot
    })
})

app.get('/invite', (req,res) => {
    res.redirect('https://discord.com/api/oauth2/authorize?client_id=905932530040070144&redirect_uri=https://3000-itamar1238-serverlist-54jbn0lqyas.ws-us34.gitpod.io/auth-guild&response_type=code&scope=bot')
})

app.all('*', (req,res) => res.render('404'))

app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
})