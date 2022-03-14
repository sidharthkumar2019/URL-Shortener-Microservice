require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { mongoose } = require('mongoose');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const { Schema } = mongoose;
const validUrl = require('valid-url');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then( () => console.log('Connected to DB ...') )
  .catch( error => console.log(error.message) );

const urlSchema = new Schema({
  originalUrl: String,
  shortUrl: String
});

const URL = mongoose.model('URL', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.json());  // parses incoming requests with JSON payloads and is based on body-parser.
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async(req, res) => {
  const originalUrl = req.body.url;
  const code = shortid.generate();

  if ( validUrl.isWebUri(originalUrl) ) {
    // check if it is already present
    let record = await URL.findOne({
      originalUrl: originalUrl
    });
    if ( record ) res.json({original_url: record.originalUrl, short_url: record.shortUrl});
    else {
      let newRecord = new URL({
        originalUrl: originalUrl,
        shortUrl: code
      });
      await newRecord.save();
      res.json({original_url: newRecord.originalUrl, short_url: newRecord.shortUrl});
    }
  }
  else
    res.json({ error: 'invalid url' });
  // res.json({original_url:req.body.url , short_url: 1});
});

app.get('/api/shorturl/:shortUrl', async(req, res) => {
  const shortUrl = req.params.shortUrl;
  let record = await URL.findOne({shortUrl: shortUrl});
  if ( record ) res.redirect(record.originalUrl);
  else res.status(404).send('No entry found for the input given.');
}); 

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
