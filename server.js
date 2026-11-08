const express = require('express');
const path = require('node:path');
const bodyParser = require('body-parser');
const movieList = require('./movies');

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Forms use URL-encoded bodies, so parse them before handling POST /name.
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.resolve(__dirname, 'public')));

app.get('/', function welcome(req, res) {
  res.type('text/plain').send('Welcome to Data Representation & Querying');
});

app.get('/hello/:name', function helloName(req, res) {
  // Express gets the name from the matching section of the path.
  const name = req.params.name;
  res.type('text/plain').send('Hello ' + name);
});

app.get('/hello/:name/:surname', function helloFullName(req, res) {
  const { name, surname } = req.params;
  res.type('text/plain').send('Hello ' + name + ' ' + surname);
});

app.get('/api/movies', function getMovies(req, res) {
  // res.json serialises the object and sets the JSON content type.
  res.status(201).json({ myMovies: movieList });
});

app.get('/index', function showForms(req, res) {
  // Resolve from this file's directory, not the terminal's current folder.
  const htmlFile = path.resolve(__dirname, 'index.html');
  res.sendFile(htmlFile);
});

function readNames(values) {
  // Reject missing fields and arrays instead of greeting someone as undefined.
  const first = values?.firstname;
  const last = values?.lastname;
  if (typeof first !== 'string' || typeof last !== 'string') return null;

  const names = [first.trim(), last.trim()];
  const valid = names.every((name) => name.length > 0 && name.length <= 100);
  return valid ? names.join(' ') : null;
}

function replyWithName(values, res) {
  const fullName = readNames(values);
  if (fullName === null) {
    return res.status(400).type('text/plain').send('Enter both names, using 1 to 100 characters for each.');
  }
  // Text responses display typed characters literally, including angle brackets.
  return res.type('text/plain').send(`Hello ${fullName}`);
}

app.get('/name', function getForm(req, res) {
  // For GET, the browser places the fields in the query string.
  replyWithName(req.query, res);
});

app.post('/name', function postForm(req, res) {
  // For POST, the parser above has already filled req.body.
  replyWithName(req.body, res);
});

// Run this only after none of the earlier routes matched.
app.use(function notFound(req, res) {
  res.status(404).type('text/plain').send('Page not found.');
});

// Express recognises error middleware by its four arguments.
app.use(function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.status === 413) {
    return res.status(413).type('text/plain').send('Form data is too large.');
  }
  if (error.status === 400) {
    return res.status(400).type('text/plain').send('The request could not be read.');
  }
  console.error(error);
  return res.status(500).type('text/plain').send('Something went wrong!');
});

// Export app for checks; listen only when this file is run directly.
if (require.main === module) {
  const listener = app.listen(port, function started() {
    console.log(`Listening at http://localhost:${port}`);
  });
  listener.on('error', function failed(error) {
    console.error('Unable to start the server:', error.message);
    process.exitCode = 1;
  });
}

module.exports = app;
