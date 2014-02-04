'use strict';

var request = require('request')
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
  options.order = options.order || ['npm', 'file', 'github'];

  async.waterfall([
    //
    // Make sure that we have the correct contents to start searching for
    // license information.
    //
    function fetch(next) {
      if ('string' !== typeof name) return next(undefined, name);

      request({
        uri: url.resolve(options.registry, name),
        method: 'GET',
        json: true
      }, function fetched(err, res, body) {
        if (err) return next(err);
        if (res.statusCode !== 200) return next(new Error('Invalid statusCode: '+ res.statusCode));

        next(err, body);
      });
    },

    //
    // Search for the correct way of parsing out the license information.
    //
    function search(data, next) {
      var parser, result;

      async.whilst(function select() {
        while (!result && (parser = parse.parsers[options.order.shift()])) {
          if (parser.supported(data)) break;
        }

        return !!parser;
      }, function does(next) {
        if (!parser) return next();

        parser.parse(data, function parsed(err, license) {
          if (err) return next(err);

          result = license;
          next();
        });
      }, function done(err) {
        next(err, result);
      });
    }
  ], fn);
}

//
// Expose our primary parsers that we can leverage to retrieve license content.
//
parse.parsers = {};
parse.parsers.github  = new(require('./github'))(exports.parsers);
parse.parsers.file    = new(require('./file'))(exports.parsers);
parse.parsers.npm     = new(require('./npm'))(exports.parsers);

//
// Expose the Parser class so we easily add new parsers through third-party if
// needed. (Think bitbucket and other code hosting sites)
//
parse.Parser = require('./Parser');

//
// Expose the actual module.
//
module.exports = parse;
