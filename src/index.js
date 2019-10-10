const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const aws = require('aws-sdk');

//custom imports
const users = require('../routes/users');
const auth = require('../routes/auth')
// const current_user = require('../routes/user');
const posts = require('../routes/posts');
const dashboard = require('../routes/dashboard');
const comments = require('../routes/comments');

dotenv.config()
const port = process.env.port || 3000;

//aws config
aws.config.setPromisesDependency();
aws.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});

//db connection
mongoose.connect(
  `${process.env.DB_URL}`,  
  { useNewUrlParser: true, useUnifiedTopology: true }, () => {
      // const s3 = new aws.S3();
      // s3.listBuckets(function(err, data) {
      //   if (err) {
      //     console.log("Error", err);
      //   } else {
      //     console.log("Success", data.Buckets);
      //   }
      // });
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
// app.use('/', current_user);
app.use('/', posts);
app.use('/', dashboard);
app.use('/', comments);


// app.get('/', (req, res) => res.send('Hello World!'));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));