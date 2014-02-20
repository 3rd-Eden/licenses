'use strict';

var debug = require('debug')('licenses::github')
  , url = require('url');

/**
 * Parser for github based URL.
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
  name: 'github',

  /**
   * All the filenames that we're interested in from Github that can potentially
   * contain the license information.
   *
   * The extensions which are added are
   *
   * @type {Array}
   * @api private
   */
  filenames: [
    'license',
    'readme',
  ].concat([
    'markdown', 'mdown', 'md', 'textile', 'rdoc', 'org', 'creole', 'mediawiki',
    'rst', 'asciidoc', 'adoc', 'asc', 'pod'
  ].reduce(function flatten(slim, extension) {
    slim.push('license.'+ extension, 'readme.'+ extension);
    return slim;
  }, [])),

  /**
   * Parse the github information from the package.
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

    var parser = this;

    this.exists(data, function exists(err, github) {
      if (err || !github) return next(err);

      var license;

      parser.root(github, function root(err, files) {
        if (err || !files || !files.length) return next(err);

        //
        // Fetch and parse the 'raw' content of the file so we can parse it.
        //
        parser.async.doWhilst(function does(next) {
          var file = files.shift();

          debug('searching %s for license information', file.name);

          parser.raw(github, file.name, function raw(err, data) {
            if (err) return next(err);

            parser.parsers.content.parse({
              content: data,
              file: file.name
            }, function parse(err, data) {
              license = data;

              if (license) debug('extracted %s from %s', data, file.name);
              next(err);
            });
          });
        }, function select() {
          return !license && files.length;
        }, function done(err) {
          next(err, license);
        });
      });
    });
  },

  /**
   * Get the raw data from github.
   *
   * @param {Object} github The parsed repository information.
   * @param {String} file The file name.
   * @param {Function} next Continuation.
   * @api private
   */
  raw: function raw(github, file, next) {
    this.request({
      uri: 'https://raw.github.com/'+ github.user +'/'+ github.repo +'/master/'+ file,
      method: 'GET'
    }, function fetched(err, res, body) {
      if (err || res.statusCode === 404) return next(err);
      if (res.statusCode !== 200) return next(new Error('Invalid status code (raw:'+ res.statusCode +')'));

      next(undefined, body);
    });
  },

  /**
   * Get the root directory from github and try to search for files that matches
   * our supported license files.
   *
   * @param {Object} github The parsed repository information.
   * @param {Function} next Continuation.
   * @api private
   */
  root: function root(github, next) {
    var url = 'https://api.github.com/repos/'+ github.user +'/'+ github.repo +'/contents'
      , parser = this;

    debug('retrieving file list from %s', url);

    this.request({
      uri: url,
      method: 'GET',
      headers: {
        'User-Agent': 'npm.im/licenses'
      },
      json: true
    }, function fetched(err, res, files) {
      if (err || res.statusCode === 404) return next(err);
      if (res.statusCode !== 200) return next(new Error('Invalid status code (root:'+ res.statusCode +')'));

      //
      // Check if we have any compatible.
      //
      files = files.filter(function filter(file) {
        var name = file.name.toLowerCase();

        // No size, not really useful for matching.
        if (file.size <= 0) return false;

        // Fast case, direct match.
        if (!!~parser.filenames.indexOf(name)) return true;

        // Slow case, partial match.
        return parser.filenames.some(function some(filename) {
          return !!~name.indexOf(filename);
        });
      });

      if (!files.length) return next();
      return next(undefined, files);
    });
  },

  /**
   * It's possible that a user has moved the repository to a new location.
   * Github automatically redirects you when you access the old page. But it
   * doesn't provide any redirection for API calls causing them to fail with
   * 404's.
   *
   * In order to detect the correct repository location we need to do a HEAD
   * check of the public github URL and use the location header as source URL
   * when we're presented with a 301 status code.
   *
   *
   * @param {String} url The possible location of the repository.
   * @param {Function} next Continuation
   * @api private
   */
  exists: function exists(github, next) {
    var parser = this;

    this.request({
      uri: 'https://github.com/'+ github.user +'/'+ github.repo,
      method: 'HEAD'
    }, function fetched(err, res, data) {
      if (err) return next(err);

      next(undefined, parser.get(res.request.href) || github);
    });
  },

  /**
   * Is github based license detection an option for this package.
   *
   * @param {Object} data The package.json or npm package contents.
   * @returns {Boolean}
   * @api public
   */
  supported: function supported(data) {
    return !!this.get(data);
  },

  /**
   * Get the actual contents that we're interested in, in this case it's the
   * location of a potential github URL.
   *
   * @param {Object} data The package.json or the npm package contents.
   * @return {String} Returns the URL or undefined.
   * @api private
   */
  get: require('extract-github')
});
