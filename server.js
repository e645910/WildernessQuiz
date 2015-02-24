var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');

var User = require('./api/models/userModel');
var UserController = require('./api/controllers/userCtrl');
var quizController = require('./api/controllers/quizCtrl');
var app = express();

mongoose.connect('mongodb://localhost/wildernessQuiz', function (error) {
    if (error) {
        console.log(error);
    }
});

passport.use(new localStrategy({
	//require the defualt username to be the person's email address 
	usernameField: 'email',
	passwordField: 'password'
}, 	function(username, password, done){
	User.findOne({ email: username }).exec().then(function(user){
		if(!user){
			return done(null, false, { message: 'Incorrect username.' });
		}
		user.comparePassword(password).then(function(isMatch){
			if(!isMatch){
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, user);
		}, function(err){
			console.log(err)
		});
	}, function(err){
		return done(err);
	});
}));

passport.serializeUser(function(user, done){
	//input user model (mongoose)
	done(null, user);
});
passport.deserializeUser(function(obj, done){
	//user object (json)
	done(null, obj);
});

app.use(bodyParser.json());
app.use(express.static(__dirname+'/public'));

app.use(session({secret: 'WILDSEEKRIT', 
	saveUninitialized: true,
    resave: true}));
app.use(passport.initialize());
app.use(passport.session());

app.post('/api/auth', passport.authenticate('local'), function(req, res){
	//if auth was successful, this will happen
	return res.status(200).end();
});

app.post('/api/register', function(req, res){
	//creates a new user
	var newUser = new User(req.body);
	newUser.save(function(err, user){
		if(err) {
			return res.status(500).json(err);
		}
		return res.json(user);
	});
});
app.post('/api/quiz', quizController.post);
app.get('/api/quiz', quizController.get);


// var isAuthed = function(req, res){
// 	if(!req.isAuthenticated()){
// 		return res.status(403).end();
// 	}
// 	return next();
// };
 
app.get('/api/profile', quizController.get);
app.post('/api/post', quizController.post);


app.listen(8000);