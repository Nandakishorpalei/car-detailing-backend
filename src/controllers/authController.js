require("dotenv").config();
const jwt = require("jsonwebtoken");

const User = require("../model/userModel");

const newToken = (user) => {
  return jwt.sign({ user: user }, process.env.JWT_SECRET_KEY, {
    expiresIn: 60 * 60 * 1, // in seconds
  });
};

const signup = async (req, res) => {
  try {
    // first check if the email provided is already given to another user
    console.log(req.body);
    let user = await User.findOne({ email: req.body.email }).lean().exec();

    // if yes then throw an error 400 Bad Request
    if (user) {
      console.log("already an user");
      return res.status(400).send({
        success: false,
        message: "User with that email already exists",
      });
    }
    // if not then we will create the user
    // we will hash the password for the user
    user = await User.create(req.body);
    console.log("user here", { user });
    // we will create the token for the user
    const token = newToken(user);

    // return the token and the user details
    return res
      .status(201)
      .send({ success: true, user, token: "Bearer " + token });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

const signin = async (req, res) => {
  try {
    // console.log(req.body);
    // first we will find the user with the email
    let user = await User.findOne({ email: req.body.email }).select(
      "-phoneOtp -emailOtp"
    );

    // if user is not found then throw an error 400 Bad Request
    if (!user) {
      console.log("no user");
      return res.status(400).send({
        success: false,
        message: "Either Email or Password is incorrect",
      });
    }

    // if user found then try to match the password provided with the password in db
    const match = user.checkPassword(req.body.password);

    // if not match then throw an error 400 Bad Request
    if (!match) {
      console.log("not matched");
      return res.status(400).send({
        success: false,
        message: "Either Email or Password is incorrect",
      });
    }

    // stateful => session on the server => cookie on the browser
    // stateless => nothing stored on the server

    // if password also matches then create a token
    const token = newToken(user);

    // return the token and the user details
    return res.status(201).send({
      success: true,
      user: user,
      token: "Bearer " + token,
    });
  } catch (err) {
    console.log({ err });
    return res.status(500).send({ success: false, message: err.message });
  }
};

// const updateUser = async(req, res)=>{
//     try {
//       console.log(req.body);
//       // first we will find the user with the email
//       let user = await User.findOne({ email: req.body.email });

//       // if user is not found then throw an error 400 Bad Request
//       if (!user) {
//         console.log("no user");
//         return res.status(400).send({
//           success: false,
//           message: "Either Email or Password is incorrect",
//         });
//       }

//       // if user found then try to match the password provided with the password in db
//       const match = user.checkPassword(req.body.password);

//       // if not match then throw an error 400 Bad Request
//       if (!match) {
//         console.log("not matched");
//         return res.status(400).send({
//           success: false,
//           message: "Either Email or Password is incorrect",
//         });
//       }

//       // stateful => session on the server => cookie on the browser
//       // stateless => nothing stored on the server

//       // if password also matches then create a token
//       const token = newToken(user);

//       // return the token and the user details
//       return res
//         .status(201)
//         .send({ success: true, user, token: "Bearer " + token });
//     } catch (err) {
//       console.log({ err });
//       return res.status(500).send({ success: false, message: err.message });
//     }
// }

module.exports = { signup, signin, newToken };
