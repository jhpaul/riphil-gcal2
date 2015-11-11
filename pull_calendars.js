// Next Step: fet events to return from "get events"


var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
// var Batchelor = require('batchelor');
var moment = require('moment-timezone');
var timeZone = "America/New_York";
var Promise = require('promise');
var async = require('async');



// Express Server
// var express = require('express');
// var app = express();
//
// app.get('/', function(req, res) {
//     res.send(eventList);
// });
//
// var server = app.listen(8080, function() {
//     var host = server.address().address;
//     var port = server.address().port;
//
//     console.log('Example app listening at http://%s:%s', host, port);
// });



var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

// Time Handling
/* use a function for the exact format desired... */
function ISODateString(d) {
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
}

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


var calendar = google.calendar('v3');

var printDate = "2015-11-05"; //to be changed to route "localhost/day/2015-11-02"
var timeMin = moment.tz(printDate + " 00:00", timeZone).format(); //"2015-11-03T00:00:00Z"
var timeMax = moment.tz(printDate + " 23:59:59", timeZone).format(); //"2015-11-03T23:59:59Z"
console.log(timeZone);
console.log("StartTime:", timeMin);
console.log("EndTime:", timeMax);
var eventList = [];
// execute with auth
function execute(auth) {
    getCalendars(auth)
        .then(function(calendars) {
            combineEvents(auth, timeMin, timeMax, calendars);
        })
        .then(
            function(events) {
                console.log("even", events);
                // events.forEach(function(event) {
                //     console.log("~~~~~~", event.summary);
                // });
            }
        )

    // .then(function(events) {
    //     console.log("z", events);
    // })
    .catch(function(error) {
        throw new Error("Error: " + error);
    });
}

// function execute(auth) {
//         // Return a new promise.
//         return new Promise(function(resolve, reject) {
//             authlocal = {
//                 auth: auth
//             }
//             return getCalendars(auth)
//                 .then(function(calendars) {
//                     getEvents(auth, timeMin, timeMax, calendars)
//                 })
//                 .then(function(vars){
//                     return vars
//                 })
//                 .catch(function(error) {
//                     throw new Error("Error: " + error)
//                 })
//
//         });
// }




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
        authlocal = {
            auth: auth
        };
        calendar.calendarList.list(authlocal,
            function(err, response) {
                if (err) {
                    reject(Error('The API returned an error: ' + err));
                } else {
                    calendars = response.items;
                    // console.log(calendars)
                    calendars.forEach(function(calendar) {
                        console.log(calendar.summary, calendar.id);
                    });
                    resolve(calendars, auth);
                    // return calendars
                }
            });

    });
}

function combineEvents(auth, timeMin, timeMax, calendars) {
    return new Promise(function(resolve, reject) {
        // calendars.forEach(function(each) {
        //             getEvents(auth, timeMin, timeMax, each);
        //     });
        x = [];
            for (var item in calendars){
                y = getEvents(auth, timeMin, timeMax, each);
                x.concat(y);
                console.log(item);
            }
            // for (var i = 1; i <= 3; i++) {
            //     sub_array.push(i);
            //     super_array.push(sub_array.concat());
            // }
            });
  // All tasks are done now
}





function getEvents(auth, timeMin, timeMax, cal,callback) {
    // Return a new promise.
    // console.log(timeMin, timeMax);
    // new Promise(function(resolve, reject) {


        function printResponse(err, response) {
            if (response && response.items && response.items.length > 0) {
                callback(null, response.items);
                // console.log(response.items[0]);
            }
        }


        calendar.events.list({
                auth: auth,
                calendarId: cal.id,
                timeMin: timeMin,
                timeMax: timeMax,
                singleEvents: 'True',
                orderBy: 'startTime'
            },
            printResponse
        );
        // return result;
        // });
        // console.log(y);
}





// function(cal){
//     events = [];
//     calendar.events.list({
//             auth: auth,
//             calendarId: cal.id,
//             timeMin: timeMin,
//             timeMax: timeMax,
//             singleEvents: 'True',
//             orderBy: 'startTime'
//         },
//         function(err, response) {
//             list = [];
//                 // console.log(response)
//             if (response && response.items && response.items.length > 0) {
//                 // console.log(response.items)
//                 Array.prototype.push(list, response.items);
//             }
//             return [list];
//         });
//     console.log("p", events);
//     return events;
// });
// });
// }




// function getEvents(err, auth, cals) {
//     if (err) {
//         return;
//     }
//     // console.log(cals);
//     cals.forEach( function (item) {
//         // console.log(item['id'])
//         listEvents(auth, item['id'], item['summary'], timeMin, timeMax, function(){} )
//         // console.log(auth);
//     })
// }




//
// function listEvents(auth, calendarId, calendarName, timeMin, timeMax, done) {
//     // Pull list of all events in a calendar
//     calendar.events.list({
//         auth: auth,
//         calendarId: calendarId,
//         timeMin: timeMin,
//         timeMax: timeMax,
//         singleEvents: 'True',
//         orderBy: 'startTime'
//     }, function(err, response) {
//         if (err) {
//             console.log("\n[", calendarName, '] The API returned an error: ' + err, "\n");
//             return;
//         }
//         events = response.items;
//         if (events) {
//             if (events.length == 0) {
//                 console.log("No Events: ", calendarName, calendarId)
//                 return;
//             }
//             // else {
//             //       events.forEach(function(item) {
//             //         //   console.log(item['summary'])
//             //       })
//             //   }
//             done(null, auth, calendarId, calendarName, timeMin, timeMax, events)
//         }
//
//         // console.log(events)
//     });
// }
