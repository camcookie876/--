const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const app = express();

const PORT = process.env.PORT || 3000;

// Replace with your actual GitHub OAuth credentials:
const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const GITHUB_CLIENT_SECRET = 'YOUR_GITHUB_CLIENT_SECRET';

// Session middleware configuration
app.use(session({
  secret: 'some secret key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// GitHub OAuth strategy
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:" + PORT + "/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // In production, store/update user record as needed.
    return done(null, profile);
  }
));

// OAuth routes
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login-failed' }),
  (req, res) => {
    res.redirect('/home.html');
  }
);

// Endpoint to return current user data as JSON
app.get('/user', (req, res) => {
  res.json(req.user || null);
});

// Serve static files from the public folder
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});