'use strict';

var argh = require('argh').argv
  , all = require('./all.json')
  , licenses = require('../')
  , async = require('async');

//
// Check if we need to continue where we last started. The package name will be
// in the
//
if (argh.continue) {
  var index = all.indexOf(argh.continue);

  if (index === -1) throw new Error('Sorry, cant slice and dice data: '+ argh.continue +' is not a valid package name');

  //
  // Slice and dice the data.
  //
  all = all.slice(index);
}

//
// Allows us to run against a maximum amount of package names.
//
if (argh.end) all = all.slice(0, argh.end);

//
// Some stats about the parsing process.
//
var stats = {
  packages: all.length,
  detected: 0,
  failed: 0
};

//
// Stores the parsed packages and the licenses we've detected.
//
var parsed = {};

//
// Run, test all the packages.
//
async.eachSeries(all, function parse(name, next) {
  licenses(name, function detected(err, licenses) {
    if (err) return next(err);

    if (!licenses || !licenses.length) {
      console.log('Unable to detect license for: ', name);
      stats.failed++;
    } else {
      parsed[name] = licenses;
      stats.detected++;
    }

    next();
  });
}, function done(err) {
  if (err) throw err;

  console.log('Parsed all packages, storing results in results.json');
  require('fs').writeFileSync(__dirname +'/results.json', JSON.stringify(
    parsed,
    null,
    2
  ));

  console.log('stats:', stats);
});
