const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
const public_users = express.Router();
const fs = require('fs');

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  const books = await JSON.parse(fs.readFileSync("./router/booksdb.json"));
  try {
      return res.status(200).json({ books });
  } catch (error) {
      return res.status(400).json({error: error.message });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',async function (req, res) {
  const ISBN = req.params.isbn;

  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${ISBN}`);
          if(response.data.totalItems === 0) {
            return res.status(400).json({error: "Book not found!"});
          } else {
            const book = response.data.items[0].volumeInfo;
            return res.status(200).json({book});
          }
  } catch (error) {
      return res.status(400).json({error: error.message});
  }
 });
  
// Get book details based on author
public_users.get('/author/:author',async function (req, res) {
  const author = req.params.author;
  try {
      const authorBooks = Object.values(books).filter(book => book.author === author);
      if(authorBooks.length === 0) {
          return res.status(400).json({error: "Author not found!"});
      } else {
          return res.status(200).json({authorBooks});
      }
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

// Get all books based on title
public_users.get('/title/:title',async function (req, res) {
  const title = req.params.title;
  try {
      const titleBooks = Object.values(books).filter(book => book.title === title);
      if(titleBooks.length === 0) {
          return res.status(400).json({error: "Title not found!"});
      } else {
          return res.status(200).json({titleBooks});
      }
    } catch (error) {
          return res.status(400).json({error: error.message});
  }
});

//  Get book review
public_users.get("/review/:isbn",async function (req, res) {
  const ISBN = req.params.isbn;

  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${ISBN}`);

        if (response.data.totalItems === 0) {
          return res.status(400).json({ error: "Book not found!" });
        } else {
          const title = response.data.items[0].volumeInfo.title;
          console.log(title);
          const review = Object.values(books).filter((book) => book.title === title)[0].reviews;
          if (Object.keys(review).length === 0) {
            return res.status(400).json({ error: "No reviews found!" });
          } else return res.status(200).json({ review });
        }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports.general = public_users;
