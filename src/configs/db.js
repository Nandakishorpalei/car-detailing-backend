const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const connect = () => {
  return mongoose.connect(
    "mongodb+srv://admin-nanda:Nanda13jan@cluster0.7ks8qcr.mongodb.net/?retryWrites=true&w=majority",
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }
  );
};

module.exports = connect;
