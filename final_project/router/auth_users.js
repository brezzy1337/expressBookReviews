const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
let users = require("./usersdb.js");
const regd_users = express.Router();


//returns boolean
//write code to check is the username is valid
const isValid = (username)=> { 
if(username in users){
  return false;
  }
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
}

//registers users with input
regd_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  try {
    const newUser = { username, password };

    //check if username is already taken
    if (!isValid(username)) {
      return res.status(400).json({ message: "Username already exists!" });
    } else {
      users[username] = newUser;
    }

    return res.status(200).json({ message: "User registered successfully!" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//only registered users can login
regd_users.post("/login", (req,res) => {
const {username, password} = req.body;

try {
  
} catch (error) {

}

  return res.status(300).json({message: "Yet to be implemented"});
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  return res.status(300).json({message: "Yet to be implemented"});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
