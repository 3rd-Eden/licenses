'use strict';

module.exports = require('./parser').extend({
  /**
   * Parse the markdown information from the package.
   *
   * @param {Object} data The package.json or npm package contents.
   * @param {Function} next Continuation.
   * @api public
   */
  parse: function parse(data, next) {
  },

  /**
   * Is markdown based license detection an option for this package.
   *
   * @param {Object} data The package.json or npm package contents.
   * @returns {Boolean}
   * @api public
   */
  supported: function supported(data) {
    return false;
  }
});
