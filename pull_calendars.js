// Next Step: get "listEvents" to return an array of events inside of an array


var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
// var Batchelor = require('batchelor');
var moment = require('moment-timezone');
var timeZone = "America/New_York"
var Promise = require('promise');



//// Express Server
// var express = require('express');
// var app = express();
//
// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });
//
// var server = app.listen(8080, function () {
//   var host = server.address().address;
//   var port = server.address().port;
//
//   console.log('Example app listening at http://%s:%s', host, port);
// });



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

// var d = new Date();
// console.log(d, ISODateString(d)); // prints something like 2009-09-28T19:03:12Z


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

// Begin Calendar Logic

// execute with auth
function execute(auth) {
  getCalendars(auth)
    .then(listCalendars)
    .then(function(val){
        console.log("yes")
        val.forEach(function(cal){
            console.log("a", cal['id'])
        })
    })
    .catch(function (error) {
        throw new Error("Error: " + error)
    })
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

var calendar = google.calendar('v3');

var printDate = "2015-11-02" //to be changed to route "localhost/day/2015-11-02"
var timeMin = moment.tz(printDate + " 00:00", timeZone).format() //"2015-11-03T00:00:00Z"
var timeMax = moment.tz(printDate + " 23:59:59", timeZone).format() //"2015-11-03T23:59:59Z"
console.log (timeZone)
console.log ("StartTime:", timeMin)
console.log ("EndTime:", timeMax)

// var promise = new Promise(function(resolve, reject) {
//   // do a thing, possibly async, then…
//
//   if (/* everything turned out fine */) {
//     resolve("Stuff worked!");
//   }
//   else {
//     reject(Error("It broke"));
//   }
// });

function getCalendars(auth) {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
      authlocal = {auth:auth}
      calendar.calendarList.list(authlocal,
          function(err, response) {
            if (err) {
              reject(Error('The API returned an error: ' + err));
          } else {
            calendars = response.items;
            // console.log(calendars)
            resolve(calendars, auth)
            // return calendars
        }
        });

  });
}

function listCalendars(calendars) {
    if (calendars) {
        calendars.forEach(function (calendar) {
            console.log("a",calendar['summary'])

    })
    return calendars
    }
    return console.error();
}
//
// function listCalendars(auth, done) {
//   // Pull list of all Calendars in the Account
//   authlocal = {auth:auth}
//   calendar.calendarList.list(authlocal,
//       function(err, response) {
//         if (err) {
//           console.log('The API returned an error: ' + err);
//          return
//         }
//         calendars = response.items;
//         // console.log(calendars)
//         done(null, auth, calendars)
//         // return calendars
//     });
//   // done(null, cals);
// }

function getEvents(err, auth, cals) {
    if (err) {
        return;
    }
    // console.log(cals);
    cals.forEach( function (item) {
        // console.log(item['id'])
        listEvents(auth, item['id'], item['summary'], timeMin, timeMax, function(){} )
        // console.log(auth);
    })
}





function listEvents(auth, calendarId, calendarName, timeMin, timeMax, done) {
  // Pull list of all events in a calendar
  calendar.events.list({
    auth: auth,
    calendarId: calendarId,
    timeMin: timeMin,
    timeMax: timeMax,
    singleEvents: 'True',
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log("\n[",calendarName, '] The API returned an error: ' + err, "\n");
      return;
  }
  events = response.items;
  if (events) {
      if (events.length == 0) {
      console.log("No Events: ", calendarName, calendarId)
      return;
    }
    // else {
    //       events.forEach(function(item) {
    //         //   console.log(item['summary'])
    //       })
    //   }
    done(null, auth, calendarId, calendarName, timeMin, timeMax, events)
  }

    // console.log(events)
  });
}
