// server.js

// require express framework and additional modules
var express = require('express'),
  app = express(),
  ejs = require('ejs'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  User = require('./models/user');
  session = require('express-session');

// connect to mongodb
mongoose.connect(
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/project1');

// set view engine for server-side templating
app.set('view engine', 'ejs');

// middleware
app.use(bodyParser.urlencoded({extended: true}));

// set session options
app.use(session({
  saveUninitialized: true,
  resave: true,
  secret: 'SuperSecretCookie',
  cookie: { maxAge: 60000 }
}));


// root route (serves index.html)
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/views/login.ejs');
});
// signup route with placeholder response
app.get('/signup', function (req, res) {
  res.send('coming soon');
});

app.get('/login', function (req, res) {
  res.render('login');
});

// user profile page
app.get('/profile', function (req, res) {
  // finds user currently logged in
  req.currentUser(function (err, user) {
    res.send('Welcome ' + user.email);
  });
});

// user submits the signup form
app.post('/users', function (req, res) {

  // grab user data from params (req.body)
  var newUser = req.body.user;

  // create new user with secure password
  User.createSecure(newUser.email, newUser.password, function (err, user) {
    res.send(user);
  });
});


// user submits the login form
app.post('/login', function (req, res) {

  // grab user data from params (req.body)
  var userData = req.body.user;

  // call authenticate function to check if password user entered is correct
  User.authenticate(userData.email, userData.password, function (err, user) {
    // saves user id to session
    req.login(user);

    // redirect to user profile
    res.redirect('/profile');
  });
});


// middleware to manage sessions
app.use('/', function (req, res, next) {
  // saves userId in session for logged-in user
  req.login = function (user) {
    req.session.userId = user.id;
  };

  // finds user currently logged in based on `session.userId`
  req.currentUser = function (callback) {
    User.findOne({_id: req.session.userId}, function (err, user) {
      req.user = user;
      callback(null, user);
    });
  };

  // destroy `session.userId` to log out user
  req.logout = function () {
    req.session.userId = null;
    req.user = null;
  };

  next();
});


//**POSTS START**
// API ROUTES

// get all posts
app.get('/api/posts', function (req, res) {
  // find all posts from the database 
  Post.find({}, function(err, allPosts){
    if (err){
      console.log("error: ", err);
      res.status(500).send(err);
    } else {
      // send all posts as JSON response
      res.json(allPosts); 
    }
  });

});

// create new post
app.post('/api/posts', function (req, res) {
  // use params (author and text) from request body
  // to create a new post
  var newPost = new Post({
    author: req.body.author,
    text: req.body.text
  });

  // save new post in db
  newPost.save(function (err, savedPost) { 
    if (err) {
      console.log("error: ",err);
      res.status(500).send(err);
    } else {
      // once saved, send the new post as JSON response
      res.json(savedPost);
    }
  });
});

// get a single post 
app.get('/api/posts/:id', function(req, res) {

  // take the value of the id from the url parameter
  // note that now we are NOT using parseInt
  var targetId = req.params.id

  // find item in database matching the id
  Post.findOne({_id: targetId}, function(err, foundPost){
    console.log(foundPost);
    if(err){
      console.log("error: ", err);
      res.status(500).send(err);
    } else {
      // send back post object
      res.json(foundPost);
    }
  });

});

// update single post
app.put('/api/posts/:id', function(req, res) {

  // take the value of the id from the url parameter
  var targetId = req.params.id;

  // find item in `posts` array matching the id
  Post.findOne({_id: targetId}, function(err, foundPost){
    console.log(foundPost); 

    if(err){
      res.status(500).send(err);

    } else {
      // update the post's author
      foundPost.author = req.body.author;

      // update the post's text
      foundPost.text = req.body.text;

      // save the changes
      foundPost.save(function(err, savedPost){
        if (err){
          res.status(500).send(err);
        } else {
          // send back edited object
          res.json(savedPost);
        }
      });
    }

  });

});

// delete post
app.delete('/api/posts/:id', function(req, res) {

  // take the value of the id from the url parameter
  var targetId = req.params.id;

 // remove item from the db that matches the id
   Post.findOneAndRemove({_id: targetId}, function (err, deletedPost) {
    if (err){
      res.status(500).send(err);
    } else {
      // send back deleted post
      res.json(deletedPost);
    }
  });
});
//**POSTS END**

// listen on port 3000
app.listen(process.env.PORT || 3000);

