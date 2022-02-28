const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildID: { type: String, require: true },
  title: { type: String, require: true },
  shortdescription: { type: String, require: true },
  longdescription: {type:String,require:true},
  inv: { type: String, require: true },
  reportID: {type: String, require: true},
  featured: {type: String, require: true},
  lastBump: {type: String, require: true}
})

const model = mongoose.model('guilds', guildSchema)

module.exports = model;