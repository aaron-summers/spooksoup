const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

//custom imports
const users = require('../routes/users');
const auth = require('../routes/auth');
const posts = require('../routes/posts');
const dashboard = require('../routes/dashboard');
const comments = require('../routes/comments');
const home = require('../routes/home');

//custom methods
const {updateSchema, deleteFields, deleteField} = require('../functions/modifySchema');


const port = process.env.port || 3000;

//db connection
mongoose.connect(
  `${process.env.DB_URL}`,  
  { useNewUrlParser: true, useUnifiedTopology: true }, () => {
      // updateSchema();
      // deleteField();
      console.log("connection enabled")
  }
);

//middleware
app.use(
  cors({
    origin: ["http://localhost:5050"],
    exposedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"]
  })
);
  //body parsing
  app.use(express.json());
//routes
app.use('/', users);
app.use('/', auth);
app.use('/', posts);
app.use('/', dashboard);
app.use('/', comments);
app.use('/', home);


// app.get('/', (req, res) => res.send('Hello World!'));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));