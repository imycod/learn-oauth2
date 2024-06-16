const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const profileSchema = new Schema({
  userId: ObjectId,
  clients: [String],
  date: { type: Date, default: Date.now },
});

const ProfileModel = mongoose.model("profile", profileSchema);

module.exports = ProfileModel;
