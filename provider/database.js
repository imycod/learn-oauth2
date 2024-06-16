const mongoose = require("mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/oauth2", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("mongodb database connected!"))
  .catch((err) => {
    console.log('mongodb database '+ err);
  });
