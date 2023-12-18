const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
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
const authenticatedUser = (username, password, users) => {
  console.log("Checking username:", username, "password:", password);
  for (let user of users) {
    console.log(
      "User in array - username:",
      user.username,
      "password:",
      user.password
    );
    if (
      user.username === username &&
      String(user.password) === String(password)
    ) {
      console.log(user.username, username);
      console.log("User Authenticated!");
      return true;
    }
  }
  console.log("Username or password is incorrect! ");
  return false;
};

const bookIndex = (title, books) => {
  for (let bookkey in books) {
    console.log(`Comparing "${books[bookkey].title}" with "${title}"`);
    if (books[bookkey].title === title) {
      return bookkey;
    }
  }
  return -1;
};

//registers users with input
regd_users.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Read the existing users
  let users;

  if (fs.existsSync("./router/usersdb.json")) {
    const data = await JSON.parse(
      fs.readFileSync("./router/usersdb.json", "utf8")
    );
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
      fs.writeFileSync(
        "./router/usersdb.json",
        JSON.stringify({ users: users }),
        null,
        2
      );
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
regd_users.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log("Username:", username, "Password:", password);

  // Read the existing users
  let users;

  if (fs.existsSync("./router/usersdb.json")) {
    const data = await JSON.parse(fs.readFileSync("./router/usersdb.json"));
    users = data.users || [];
    console.log("File exists:" + JSON.stringify(users));
  } else {
    console.log("File does not exist");
  }

  try {
    if (authenticatedUser(username, password, users) === false) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    jwt.sign({ username }, "access", (err, accessToken) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.cookie("accessToken", accessToken, { httpOnly: true });
      return res
        .status(200)
        .json({ message: "User logged in successfully!", accessToken });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Add a book review
regd_users.post("/review/:ISBN", async (req, res) => {
  const ISBN = req.params.ISBN;
  const rating = req.body.rating;
  const comment = req.body.comment;

  const token = req.cookies.accessToken;
  console.log("Token:", token);

  const username = jwt.decode(token).username;
  console.log("Username:", username);

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${ISBN}`
    );

    if (response.data.totalItems === 0) {
      return res.status(400).json({ error: "Book not found!" });
    }

    // Access the title from res.locals outside of the axios callback
    const title = await response.data.items[0].volumeInfo.title;
    console.log("Title:", title);
    const Index = bookIndex(title, books);
    console.log("Book index:", Index);

    if (Index !== -1 && username in books[Index].reviews.username) {
      books[Index].reviews[user] = { username, rating, comment };
      fs.writeFileSync("./router/booksdb.json", JSON.stringify(books), null, 2);
      return res.status(200).json({ message: "Review replaced successfully!" });
    } else if (Index !== -1 && !(username in books[Index].reviews)) {
      books[Index].reviews = { user: { username, rating, comment } };
      fs.writeFileSync("./router/booksdb.json", JSON.stringify(books), null, 2);
      return res.status(200).json({ message: "Review added successfully!" });
    } else {
      return res.status(400).json({ message: "Book not found!" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

regd_users.delete("/review/:isbn", async (req, res) => {
  const ISBN = req.params.isbn;
  const token = req.cookies.accessToken;
  const username = jwt.decode(token).username;
  console.log("Token:", token);
  console.log("Username:", username);

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${ISBN}`
    );

    if (response.data.totalItems === 0) {
      return res.status(400).json({ error: "Book not found in API!" });
    }

    const books = JSON.parse(fs.readFileSync("./router/booksdb.json"));

    // Access the title from res.locals outside of the axios callback
    const title = response.data.items[0].volumeInfo.title;
    console.log("Title:", title);
    const Index = bookIndex(title, books);
    console.log("Book index:", Index);

    console.log("Book:", books[Index]);

    if (
      Index !== -1 &&
      username === books[Index].reviews.user.username
    ) {
      delete books[Index].reviews.user;
      fs.writeFileSync("./router/booksdb.json", JSON.stringify(books), null, 2);
      return res.status(200).json({ message: "Review deleted successfully!" });
    } else {
      return res.status(400).json({ message: "Book not found in database!" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
