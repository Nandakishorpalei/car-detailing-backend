const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const connect = () => {
  return mongoose.connect(process.env.MONGODB_CONNECT_URL);
};

module.exports = connect;
