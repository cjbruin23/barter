const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors')

const Schema = mongoose.Schema;

const DB_USER = 'admin';
const DB_PASSWORD = '9323Kenzie';
const DB_URI = 'ds219191.mlab.com:19191';
const dbName = 'barter-mac';

const app = express();
app.use(bodyParser.urlencoded({ extended: false}))
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(`mongodb://${DB_USER}:${DB_PASSWORD}@${DB_URI}/${dbName}`);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to the database');
});

const userSchema = new Schema({
    userName: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    items: [{
        itemName: String,
        imageURL: String,
        description: String,
    }]
})


const User = mongoose.model('User', userSchema)

app.get('/', (req, res) => {
    res.send('hello');
})

app.post('/register', (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    const inputUsername = req.body.username;
    const inputPassword = req.body.password;

    let newUser = new User({
        userName: inputUsername, 
        password: inputPassword
    })

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            if(err) {
                res.send(err);
            }
            newUser.password = hash;
            
            newUser.save((err) => {
                if (err) {
                    console.log(err)
                    res.send(JSON.stringify({'message': 'Username is already taken'}));
                }else {
                    res.send(JSON.stringify({'message': 'you were successful'}));
                }
            })
            const token = jwt.sign({ user: 'user' }, 'secret');
            console.log(token);
        });
    })
})

app.post('/login', (req, response) => {
    let username = req.body.username;
    let password = req.body.password;

    User.find({userName:username}, 'userName password', function(err, docs){
        if(err) {response.send(err)}
        if (docs.length === 0) {
            response.send(JSON.stringify({'message': 'Wrong username or password'}))
        } else {
            bcrypt.compare(password, docs[0].password, (err, result) => {
                if(err) response.send(err);    
                if(result) {
                    jwt.sign({password: docs[0].password}, 'secretkey', (err, token) => {
                        if(err) {response.send(err);
                        } else {
                            response.send(JSON.stringify({'token': token}));
                        }
                    })
                }
            })
        }

    })
});

app.listen(process.env.PORT || 5000, () => {
    console.log("Express server listening");
});