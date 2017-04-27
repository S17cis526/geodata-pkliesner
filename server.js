"use strict;"

// The port to serve on
const PORT = 3000;

// global variables
var fs = require('fs');
var http = require('http');
var server = new http.Server(handleRequest);

// Start the server
server.listen(PORT, function() {
  console.log("Listening on port", PORT);
});

/** @function serveFile
 * Serves a static file resource
 * @param {string} file - the path to the file
 * @param {string} type - the Content-Type of the file
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function serveFile(file, type, req, res) {
  fs.readFile(file, function(err, data) {
    if(err) {
      console.error(err);
      res.statusCode = 500;
      res.end("Server Error");
      return;
    }
    res.setHeader('ContentType', type);
    res.end(data);
  });
}


function addLocation(req, res) {
  var url = require('url').parse(req.url);
  var qs = require('querystring').parse(url.query);
  var address = qs.address;

  // Perform geolocation with address
  http.get('http://www.datasciencetoolkit.org/maps/api/geocode/json?sensor=false&address=' + address, function(request){
    var body = "";
    request.on('err', function() {
      // draw the index with an error status
      res.statusCode = 500;
      return serveFile('public/index.html', 'text/html', req, res);
    });
    request.on('data', function(chunk) {
      body += chunk;
    });
    request.on('end', function() {
      var response = JSON.parse(body);
      // Read in the current location data
      fs.readFile('data/locations.json', function(err, data){
        if(err) {
          res.statusCode = 500;
          return serveFile('public/index.html', 'text/html', req, res);
        }
        // Parse the locations
        var locations = JSON.parse(data);
        // Add the new results to the location data
        response.results.forEach(function(result){
          locations.push({
            address: result.formatted_address,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng
          })
        })
        // Write the amended locations back to the file
        fs.writeFile('data/locations.json', JSON.stringify(locations), function(err){
          if(err) {
            res.statusCode = 500;
            return serveFile('public/index.html', 'text/html', req, res);
          }
          // Display the index page
          serveFile('public/index.html', 'text/html', req, res);
        });
      });

    });
  });
}

/** @function handleRequest
 * Handles incoming http requests
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function handleRequest(req, res) {
  var url = require('url').parse(req.url);

  switch(url.pathname) {
    // Serving static files
    case '/':
    case '/index.html':
      serveFile('public/index.html', 'text/html', req, res);
      break;
    case '/style.css':
      serveFile('public/style.css', 'text/css', req, res);
      break;
    case '/script.js':
      serveFile('public/script.js', 'text/css', req, res);
      break;
    case '/pin.png':
      serveFile('public/pin.png', 'image/png', req, res);
      break;

    // Serve geodata
    case '/locations.json':
      serveFile('data/locations.json', 'application/json', req, res);
      break;
    case '/united-states.json':
      serveFile('data/united-states.json', 'application/json', req, res);
      break;

    // Load location
    case '/add-location':
      addLocation(req, res);
      break;

    // Serve error code
    default:
      res.statusCode = 404;
      res.end("Not found");
  }
}
