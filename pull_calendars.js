var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
// var Batchelor = require('batchelor');

var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

// Time Handling
/* use a function for the exact format desired... */
function ISODateString(d){
 function pad(n){return n<10 ? '0'+n : n}
 return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'Z'}

var d = new Date();
console.log(ISODateString(d)); // prints something like 2009-09-28T19:03:12Z


// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Calendar API.
  // authorize(JSON.parse(content), listEvents);
  authorize(JSON.parse(content), execute);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
 var calendar = google.calendar('v3');

function listCalendars(auth, done) {
  // Pull list of all Calendars in the Account
  authlocal = {auth:auth}
  calendar.calendarList.list(authlocal,
      function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
         return
        }
        calendars = response.items;
        // console.log(calendars)
        done(null, auth, calendars)
        // return calendars
    });
  // done(null, cals);
}

function listEvents(auth, calendarId) {
  // Pull list of all events in a calendar
  calendar.events.list({
    auth: auth,
    calendarId: calendarId,
    timeMin: "2015-11-03T00:00:00Z",
    timeMax: "2015-11-04T00:00:00Z"
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    events = response.items;
    // console.log(events)
  });
}
function printCals(err, auth, cals) {
    if (err) {
        return;
    }
    // console.log(cals);
    cals.forEach( function (item) {
        // console.log(item['id'])
        listEvents(auth, item['id'])
        // console.log(auth);
    })
}


function execute(auth) {
  listCalendars(auth, printCals)
  // }
  // listEvents(auth)

// Batch Requesting Works, but looks like I need a different API Key, that's a pain so let's wait for now
  // var batch = new Batchelor({
  //     'uri':'https://www.googleapis.com/batch',
  //     'method':'POST',
  //     'auth':
  //     {
  //         'bearer': auth['credentials']['access_token']
  //     },
  //     'headers': {
  //         'Content-Type': 'multipart/mixed'
  //     }
  // });
  // batch.add({
  //     'method':'GET',
  //     'path':'/calendar/v3/users/me/calendarList'
  // })
  // batch.run(function(err, response){
  //     console.log('response:', response);
  //   //   res.json(response);
  // });
}