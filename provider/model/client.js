const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const clientSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  secret: {
    type: String,
    required: true,
    trim: true,
  },
  redirect_url: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (!value.startsWith("http")) {
        throw new Error("redirect_url must start with http");
      }
    },
  },
  date: { type: Date, default: Date.now },
});

const ClientModel = mongoose.model("client", clientSchema);

module.exports = ClientModel;
