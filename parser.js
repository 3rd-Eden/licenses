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
 * @returns {Array}
 * @api public
 */
Parser.readable('test', function test(str) {
  if (/BSD/.test(str)) return ['BSD'];
  if (/GPL/.test(str) || /GPLv2/.test(str)) return ['GPL'];
  if (/LGPL/.test(str)) return ['LGPL'];
  if (/MIT/.test(str) || /\(MIT\)/.test(str)) return ['MIT'];
  if (/Apache\s?Licen[cs]e/.test(str)) return ['Apache'];
  if (/MPL/.test(str)) return ['MPL'];

  //
  // Watch out we've got a bad-ass over here.
  //
  if (/DO\sWHAT\sTHE\sFUCK\sYOU\sWANT\sTO\sPUBLIC\sLICEN[CS]E/i.test(str)
   || /WTFPL/.test(str)
  ) return ['WTFPL'];
});

/**
 * There are 1000 ways of writing that you're using an MIT module. This
 * normalization module attempts to normalize the licenses in to one common
 * name.
 *
 * @param {Array} data A list of license information that needs to be normalized.
 * @api public
 */
Parser.readable('normalize', function normalize(data) {
  return data;
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
