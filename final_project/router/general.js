const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  //Write your code here
  return res.status(300).json({message: "Yet to be implemented"});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  try {
      return res.status(200).json({ books });
  } catch (error) {
      return res.status(400).json({error: error.message });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const ISBN = req.params.isbn;

  try {
      axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${ISBN}`)
        .then(response => {
          if(response.data.totalItems === 0) {
            return res.status(400).json({error: "Book not found!"});
          } else {
            const book = response.data.items[0].volumeInfo;
            return res.status(200).json({book});
          }
        });
  } catch (error) {
      return res.status(400).json({error: error.message});
  }
 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
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
public_users.get('/title/:title',function (req, res) {
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
public_users.get('/review/:isbn',function (req, res) {
  const ISBN = req.params.isbn;
  try {
      const book = Object.values(books).filter(book => book.ISBN === ISBN);
      if(book.length === 0) {
          return res.status(400).json({error: "Book not found!"});
      } else {
          return res.status(200).json({book});
      }
    } catch (error) {
          return res.status(400).json({error: error.message}); 
  }
});

module.exports.general = public_users;
