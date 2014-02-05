'use strict';

var natural = require('natural')
  , fuse = require('fusing')
  , fs = require('fs');

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
  //
  // First we need to pass the data through our dual license checker so can
  // figure out if the module is dual licensed as both license values needs to
  // be normalized.
  //
  // 1. Direct match. Check for direct matches against our normalized license
  //    file.
  //
  // 2. toLowercase. Transform the given license string and the key of
  //    normalization to lowercase to see if it matches.
  //
  // 3. String distance. To see if there might have been some mistakes.
  //
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

/**
 * Check for potential dual licensing in the given license arrays. Most people
 * specify them in their package.json as : MIT/GPL because the `npm init`
 * doesn't really allow dual licensing.
 *
 * @param {Array} licenses
 * @returns {Array} licenses
 * @api public
 */
Parser.readable('dual', function dual(licenses) {
  var licensing = [];

  // check for / , or and, +
  return licenses.reduce(function reduce(licenses, license) {
    Array.prototype.push.apply(licenses, license.split(/\s{0,}(?:\/|and|or|,)\s{0,}/g));

    return licenses;
  }, []).filter(function duplicate(item, index, all) {
    return all.indexOf(item) === index;
  });
});

//
// Setup and train our classifier.
//
var classifier = new natural.BayesClassifier();

[
  { file: 'AFL2.1.txt',       as: 'AFL 2.1'       },
  { file: 'AFL3.0.txt',       as: 'AFL 3.0'       },
  { file: 'AGPL3.0.txt',      as: 'AGPL 3.0'      },
  { file: 'APL-1.0.txt',      as: 'APL 1.0'       },
  { file: 'Apache2.0.txt',    as: 'Apache 2.0'    },
  { file: 'BSD-2-Clause.txt', as: 'BSD 2-Clause'  },
  { file: 'BSD-3-Clause.txt', as: 'BSD 3-Clause'  },
  { file: 'BSD.txt',          as: 'BSD 4-Clouse'  },
  { file: 'BSL1.0.txt',       as: 'BSL 1.0'       },
  { file: 'EPL-1.0.txt',      as: 'EPL 1.0'       },
  { file: 'GPL-2.0.txt',      as: 'GPL 2.0'       },
  { file: 'GPL-3.0.txt',      as: 'GPL 3.0'       },
  { file: 'ISC.txt',          as: 'ISC.txt'       },
  { file: 'LGPL-2.1.txt',     as: 'LGPL 2.1'      },
  { file: 'LGPL-3.0.txt',     as: 'LGPL 3.0'      },
  { file: 'MIT.txt',          as: 'MIT'           },
  { file: 'MPL-1.0.txt',      as: 'MPL'           },
  { file: 'MPL-2.0.txt',      as: 'MPL 2.0'       },
  { file: 'Python2.txt',      as: 'Python 2.0'    },
  { file: 'UNLICENSE.txt',    as: 'UNLICENSE'     },
  { file: 'WTFPL.txt',        as: 'WTFPL'         },
  { file: 'beerware.txt',     as: 'Beerware'      },
  { file: 'cddl1.txt',        as: 'CDDL 1.0'      },
  { file: 'nasa.txt',         as: 'NASA 1.3'      },
  { file: 'zlib.txt',         as: 'zlib/libpng'   }
].forEach(function train(lesson) {
  classifier.addDocument(
    fs.readFileSync(__dirname +'/licenses/'+ lesson.file, 'utf-8'),
    lesson.as
  );
});

classifier.train();
Parser.readable('classifier', classifier);

//
// Expose the parser.
//
module.exports = Parser;
