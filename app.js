const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const redis = require("redis");
const nanoid = require("nanoid");

//env variables for the redis db test
// const redisPassword = process.env.redisPassword;
// const dbURL = process.env.dbURL;

const redisPassword = "INSERT PASSWORD HERE";
const dbURL = "INSERT Database URL here";

// Create Redis Client
let client = redis.createClient({
  url: dbURL,
  auth_pass: redisPassword
});

client.on("connect", function() {
  console.log("Connected to Redis...");
});

// Set Port
const port = process.env.PORT || 8080;

// Init app
const app = express();

// View Engine\
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// methodOverride
app.use(methodOverride("_method"));

// Search Page
app.get("/search", function(req, res, next) {
  res.render("searchusers");
});

// Main Page
app.get("/", function(req, res, next) {
  res.render("shortURL");
});

// REDIRECTTTTT
app.get("/:id", function(req, res, next) {
  client.hgetall(req.params.id, function(err, obj) {
    if (!obj) {
      res.render("searchusers", {
        error: "URL does not exist"
      });
    } else {
      obj.id = req.params.id;
      console.log(obj);
      let fin = obj.main_url;
      let hi = fin.toString();
      // hi = "https://" + fin;
      console.log(hi);
      res.status(301).redirect("https://" + hi);
    }
  });
});

// Process Add User Page
app.post("/", function(req, res, next) {
  // let id = req.body.id;
  let id = nanoid.nanoid();
  let main_url = req.body.main_url;

  client.hmset(id, ["main_url", main_url], function(err, reply) {
    if (err) {
      console.log(err);
    } else {
      res.render("finalURL", {
        error: "https://shorter-url-api.herokuapp.com/" + id
      });
    }
    console.log(reply);
    console.log(id);

    // res.redirect("/");
  });
});

// Search processing
app.post("/user/search", function(req, res, next) {
  let id = req.body.id;

  client.hgetall(id, function(err, obj) {
    if (!obj) {
      res.render("searchusers", {
        error: "URL does not exist"
      });
    } else {
      obj.id = id;
      res.render("details", {
        user: obj
      });
    }
  });
});

// Add User Page
app.get("/user/add", function(req, res, next) {
  res.render("adduser");
});

// Process Add User Page
app.post("/user/add", function(req, res, next) {
  // let id = req.body.id;
  let id = nanoid.nanoid();
  let first_name = req.body.first_name;
  let last_name = req.body.last_name;
  let email = req.body.email;
  let phone = req.body.phone;

  client.hmset(
    id,
    [
      "first_name",
      first_name,
      "last_name",
      last_name,
      "email",
      email,
      "phone",
      phone
    ],
    function(err, reply) {
      if (err) {
        console.log(err);
      }
      console.log(reply);

      res.redirect("/");
    }
  );
});

// Delete User
app.delete("/user/delete/:id", function(req, res, next) {
  client.del(req.params.id);
  res.redirect("/");
});

app.listen(port, function() {
  console.log("Server started on port " + port);
});
