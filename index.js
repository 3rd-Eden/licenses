'use strict';

var debug = require('debug')('licenses::parse')
  , request = require('request')
  , async = require('async')
  , url = require('url');

/**
 * @param {String} name The module name or the package.json contents.
 * @param {Object} options Configuration of the parse process.
 * @param {Function} fn Callback.
 * @api public
 */
function parse(name, options, fn) {
  if ('function' === typeof options) {
    fn = options;
    options = null;
  }

  options = options || {};
  options.registry = options.registry || 'http://registry.nodejitsu.com';
  options.order = options.order || ['registry', 'content', 'github'];

  async.waterfall([
    //
    // Make sure that we have the correct contents to start searching for
    // license information.
    //
    function fetch(next) {
      if ('string' !== typeof name) return next(undefined, name);

      debug('was given a string, retreiving package from npm : %s', options.registry);

      request({
        uri: url.resolve(options.registry, name),
        method: 'GET',
        json: true
      }, function fetched(err, res, data) {
        if (err) return next(err);
        if (res.statusCode !== 200) return next(new Error('Invalid statusCode: '+ res.statusCode));

        //
        // With npm you can never be sure of the data structure. We want to get
        // the latest package from the data structure so we need double, triple
        // checks.
        //
        if (
             'object' === typeof data
          && 'dist-tags' in data
          && 'object' === typeof data.versions
          && 'latest' in data['dist-tags']
          && data['dist-tags'].latest in data.versions
        ) {
          var readme = data.readme;
          data = data.versions[data['dist-tags'].latest];
          data.readme = data.readme || readme;

          debug('found "dist-tags" updating data to latest version');
        }

        next(err, data);
      });
    },

    //
    // Search for the correct way of parsing out the license information.
    //
    function search(data, next) {
      if (!options.order.length) return next();

      var parser, result, name;

      async.doWhilst(function does(next) {
        name = options.order.shift();
        parser = parse.parsers[name];

        if (!parser.supported(data)) return next();

        debug('attempting to extract the license information using: %s', name);

        parser.parse(data, function parsed(err, license) {
          if (err) return next(err);

          result = license;

          if (result) debug('parsing with %s was successful', name);
          next();
        });
      }, function select() {
        return !result && options.order.length;
      }, function done(err) {
        next(err, result, name);
      });
    }
  ], fn);
}

//
// Expose the Parser class so we easily add new parsers through third-party if
// needed. (Think bitbucket and other code hosting sites)
//
parse.Registry = require('./registry'); // Parse license out of package
parse.Content = require('./content');   // Parse license of out file content.
parse.Parser  = require('./Parser');    // Base parser class.
parse.Github  = require('./github');    // Parse license info from github.

//
// Expose our primary parsers that we can leverage to retrieve license content.
//
parse.parsers = {};
parse.parsers.registry  = new parse.Registry(parse.parsers);
parse.parsers.content   = new parse.Content(parse.parsers);
parse.parsers.github    = new parse.Github(parse.parsers);

//
// Expose the actual module.
//
module.exports = parse;
