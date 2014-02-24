'use strict';

var debug = require('debug')('licenses::parse')
  , Registry = require('npm.js')
  , async = require('async')
  , url = require('url');

/**
 * Fetch the thing.
 *
 * @param {Mixed} name The module name or the package.json contents.
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
  options.githulk = options.githulk || null;
  options.order = options.order || ['registry', 'content', 'github'];
  options.registry = options.registry || new Registry({ githulk: options.githulk });

  async.waterfall([
    //
    // Make sure that we have the correct contents to start searching for
    // license information.
    //
    function fetch(next) {
      if ('string' !== typeof name) return next(undefined, name);

      options.registry.packages.get(name, next);
    },

    //
    // Search for the correct way of parsing out the license information.
    //
    function search(data, next) {
      if (!options.order.length) return next();
      if (Array.isArray(data)) data = data[0];

      var parser, result, name;

      async.doWhilst(function does(next) {
        name = options.order.shift();
        parser = parse.parsers[name];

        if (!parser.supported(data)) return next();

        debug('attempting to extract the license information using: %s', name);

        parser.parse(data, options, function parsed(err, license) {
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
parse.Parser  = require('./parser');    // Base parser class.
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
