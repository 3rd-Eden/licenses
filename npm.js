'use strict';

/**
 * Parser for npm based license information.
 *
 * @constructor
 * @api public
 */
module.exports = require('./parser').extend({
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

    this.async.some(data, function some() {

    }, function done(err, data) {
      next(err);
    });
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
    }

    if ('object' === typeof data.licenses && Object.keys(data.licenses).length) {
      Array.prototype.push.apply(
        matches,
        Object.keys(data.licenses).map(function map(key) {
          if (!parser.license(data.licenses[key])) return undefined;
          return data.licenses[key];
        }).filter(Boolean)
      );
    }

    if (matches.length) return matches;
  }
});
