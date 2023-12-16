const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");
const regd_users = express.Router();
const fs = require("fs");

//returns boolean
//write code to check is the username is valid
function isValid(username, users) {
  for (let user of users) {
    console.log("user:", user);
    if (user.username === username) {
      console.log(user.username, username);
      console.log("Username already exists!");
      return false;
    }
  }
  console.log("Username is valid!");
  return true;
}

//write code to check if username and password match the one we have in records.
//returns boolean
const authenticatedUser = (username, password) => {
  if (username in users) {
    if (users[username].password === password) {
      return true;
    }
  }
};

//registers users with input
regd_users.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Read the existing users
  let users;

  if (fs.existsSync("./router/usersdb.json")) {
    const data = await JSON.parse(fs.readFileSync("./router/usersdb.json", "utf8"));
    users = data.users || [];
    console.log("File exists:" + JSON.stringify(users));
  } else {
    console.log("File does not exist");
  }

  // Determine the next ID
  const maxId = Math.max(...users.map((user) => user.id));
  const newId = maxId + 1;
  console.log("New ID:" + newId);

  const newUser = { id: newId, username: username, password: password };

  try {
    //check if username is already taken
    if (!isValid(username, users)) {
      return res.status(400).json({ message: "Username already exists!" });
    }
    // Write the users object to a JSON file
    users.push(newUser); // Push the newUser object to the users array after checking if the username is valid
    console.log("post push:", newUser);
    try {
      fs.writeFileSync("./router/usersdb.json", JSON.stringify({ users: users }), null, 2);
    } catch (error) { 
      console.log(error);
    }
    console.log(users);
    return res.status(200).json({ message: "User registered successfully!" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  try {
    if (authenticatedUser(username, password) === false) {
      return res.status(400).json({ message: "Invalid username or password" });
    } else {
      jwt.sign({ username }, "access", (err, accessToken) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        req.session.authorization = { accessToken };
      });
      return res.status(200).json({ message: "User logged in successfully!" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Add a book review
regd_users.post("/review/:ISBN/:rating/:comment", async (req, res) => {
  const { ISBN, rating } = req.params;
  const username = jwt.decode(req.session.authorization.accessToken).username;
  const comment = req.params.comment;

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${ISBN}`
    );

    if (response.data.totalItems === 0) {
      return res.status(400).json({ error: "Book not found!" });
    }

    // Access the title from res.locals outside of the axios callback
    const title = response.data.items[0].volumeInfo.title;
    let bookIndex = books.findIndex((book) => book.title === title);
    console.log(title, bookIndex);

    if (bookIndex !== -1 && username in books[bookIndex].reviews) {
      books[bookIndex].reviews[username] = { rating, comment };
      return res.status(200).json({ message: "Review replaced successfully!" });
    } else if (bookIndex !== -1 && !(username in books[bookIndex].reviews)) {
      books[bookIndex].reviews[username] = { rating, comment };
      return res.status(200).json({ message: "Review added successfully!" });
    } else {
      return res.status(400).json({ message: "Book not found!" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
