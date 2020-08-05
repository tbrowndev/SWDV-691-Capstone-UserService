// Set up
'use strict'
var argon2 = require('argon2');
var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cors = require('cors');


// Configuration
var connection;
const db_config = require('../db_config.json');;

app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());
app.use(cors());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'DELETE, POST, PUT');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

function handleDisconnect() {
    connection = mysql.createConnection(db_config);

    connection.connect(function (err) {
        if (err) {
            console.log("User Service has error connection to db: " + err);
            setTimeout(handleDisconnect, 2000);
        }
        console.log("User Service is connected to db")
    });

    connection.on("error", function (err) {

        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log("User Service lost connection to database", err);
            console.log("User Service is reattempting database connection....")
            handleDisconnect();
        }
        else {
            console.log(err);
            console.log("User Service no longer has a connection to db")
        }
    });
}

handleDisconnect(); // starts database connection. 

// Start app and database connection and listen on port 6220  
app.listen(process.env.USER_PORT || 6220);
console.log("User Service listening on port  - ", (process.env.USER_PORT || 6220));


/**Gets a list of all groups associated with user
 *
 * Params: user_id
 * return: list of user groups (id, name, description, goal)
 *
 */
app.get('/users/:id/groups', function (req, res) {

    let user = req.body.id;
    user_groups = []
    try {
        let query = "CALL Get_user_groups("+user+");";
        connection.query(query, function(err, results){
            if(err){throw err}
            else{
                results.forEach(group => {
                    found_group = new Group(group.id, group.group_name, group.description, group.goal);
                    user_groups.push(found_group);
                });
                res.sendStatus(200).send(user_groups);
            }
        })
    } catch (err) {
        
    }

});

/** Gets the most recent posts from groups associated with user.
 * look at most recent post in the last 30 days per group
 *
 * params: user_id
 * return: list of posts per group (post_id, group_id, group_name, member_name, post, timestamp)
*/

app.get('/users/:id/feed', function (req, res) {
    
    let home_feed = [];
    let user = req.body.id;

    try {
        let post_query = "CALL Get_user_homefeed("+user+");";
        connection.query(post_query, function(err, result){
            if(err){throw err}
            else{
                result.forEach(post => {
                    var feed_posts = new Post(post.id, post.group_id, post.group_name, post.member_name, post.post, post.timestamp);
                    home_feed.push(feed_posts);
                })
                res.sendStatus(200).send(feed_posts);
            }
        })
    } catch (err) {

    }
});

/** Get user information
 *
 * params: user_id
 * return user data( user_id, user_name, user_email, user_phone, username)
 */

app.get('/users/:id', function (req, res) {
    let user = req.body.id;
    try {
        let post_query = "CALL Get_user_information("+user+")";
        connection.query(post_query, function(err, result){
            if(err){throw err}
            else{
                let current_user = new User(result.id, result.full_name, result.email, result.phone, result.username);
                res.sendStatus(200).send(current_user);
            }
        })
    } catch (err) {

    }
});


/**
 * OBJECTS TO PASS DATA TO AND FROM APPLICATION. 
 */

/**
 * holds group information 
 */
class Group {
    
    constructor(id, name, description, goal) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.goal = goal;
    }

}

/**holds post information for user
 * 
 */
class Post {

    constructor(id, group_id, group, member, post, timestamp){
        this.id = id;
        this.group_id = group_id;
        this.group = group;
        this.member = member;
        this.post = post;
        this.timestamp = timestamp;
    }

}

/** hold user informaiton
 * 
 */
class User{

    constructor(id, name, email, phone, username){
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.username = username;
    }
    
}