'use strict';

var debug = require('debug')('licenses::npm');

/**
 * Parser for npm based license information.
 *
 * @constructor
 * @api public
 */
module.exports = require('./parser').extend({
  /**
   * The name of this parser.
   *
   * @type {String}
   * @private
   */
  name: 'npm',

  /**
   * Parse the npm license information from the package.
   *
   * @param {Object} data The package.json or npm package contents.
   * @param {Function} next Continuation.
   * @api public
   */
  parse: function parse(data, next) {
    data = this.get(data);

    //
    // We cannot detect a license so we call the callback without any arguments
    // which symbolises a failed attempt.
    //
    if (!data) return next();

    debug('found %s in the package contents', data);

    // @TODO handle the edge case where people give us an URL instead of an
    // actual license.
    next(undefined, this.normalize(data));
  },

  /**
   * @param {Object} data The object that should contain the license.
   * @returns {String}
   * @api private
   */
  license: function licenses(data) {
    if ('string' === typeof data && data) return data;
    if ('type' in data && data.type) return data.type;

    return;
  },

  /**
   * Is npm based license detection an option for this package.
   *
   * @param {Object} data The package.json or npm package contents.
   * @returns {Boolean}
   * @api public
   */
  supported: function supported(data) {
    return !!this.get(data);
  },

  /**
   * Retrieve the possible locations of the license information.
   *
   * @param {Object} data The package.json or npm package contents.
   * @returns {Array}
   * @api private
   */
  get: function get(data) {
    var parser = this
      , matches = [];

    if ('string' === typeof data.license) {
      return [data.license];
    }

    if ('string' === typeof data.licenses) {
      return [data.licenses];
    }

    if (Array.isArray(data.licenses)) {
      Array.prototype.push.apply(
        matches,
        data.licenses.map(function filter(item) {
          return parser.license(item);
        }).filter(Boolean)
      );
    } else if ('object' === typeof data.licenses) {
      Array.prototype.push.apply(
        matches,
        parser.license(data)
      );
    }

    if (matches.length) return matches;
  }
});
