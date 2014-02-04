'use strict';

var fuse = require('fusing');

/**
 * The base parser class where all parsers inherit from. This provides some
 * common functionality which the parsers can use to detect licensing.
 *
 * @constructor
 * @param {Object} parsers An object which contains all available parsers.
 * @api public
 */
function Parser(parsers) {
  if (!(this instanceof Parser)) return new Parser(parsers);

  this.parsers = parsers;
}

fuse(Parser);

/**
 * Expose some core modules through the instance.
 *
 * @type {Function}
 * @api pubilc
 */
Parser.readable('async', require('async'));
Parser.readable('request', require('request'));

/**
 * Simple regular expression based tests for figuring out which license we're
 * dealing with.
 *
 * @param {String} str
 * @returns {String}
 * @api public
 */
Parser.readable('test', function test(str) {
  if (/\sBSD\s/.test(str)) return 'BSD';
  if (/\sGPL\s/.test(str) || /\sGPLv2\s/.test(str)) return 'GPL';
  if (/\sLGPL\s/.test(str)) return 'LGPL';
  if (/\sMIT\s/.test(str) || /\s\(MIT\)\s/.test(str)) return 'MIT';
  if (/\sApache\sLicen[cs]e\s/.test(str)) return 'Apache';
  if (/\sMPL\s/.test(str)) return 'MPL';

  //
  // Watch out we've got a bad-ass over here.
  //
  if (/\sDO\sWHAT\sTHE\sFUCK\sYOU\sWANT\sTO\sPUBLIC\sLICEN[CS]E\s/i.test(str)
   || /\sWTFPL\s/.test(str)
  ) return 'WTFPL';
});

/**
 * Find an URL in the data structure.
 *
 * @param {Object} data Data structure
 * @param {String} contains A string that the URL should contain.
 * @api public
 */
Parser.readable('url', function url(data, contains) {
  if (!data) return undefined;

  if ('string' === typeof data && ~data.indexOf(contains)) return data;
  if ('object' === typeof data) {
    if ('url' in data) return url(data.url, contains);
    if ('web' in data) return url(data.web, contains);
  }

  return undefined;
});

//
// Expose the parser.
//
module.exports = Parser;
