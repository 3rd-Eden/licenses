describe('Parser', function () {
  'use strict';

  var assume = require('assume')
    , licenses = require('../')
    , Parser = licenses.Parser
    , parser = new Parser();

  var Registry = require('npm-registry')
    , npmjs = new Registry({ registry: Registry.mirrors.npmjs });

  it('exposes the `async` module', function () {
    assume(parser.async).to.equal(require('async'));
  });

  it('can be constructed without new', function () {
    assume(Parser()).is.instanceOf(Parser);
  });

  describe('#test', function () {
    it('provides basic checks of license fragments', function () {
      var MIT = parser.test(['The module is licensed under MIT'].join('\n'))[0]
        , GLP = parser.test(['The module is licensed under GPLv3'].join('\n'))[0]
        , LGPL = parser.test(['The module is licensed under LGPL'].join('\n'))[0]
        , BSD = parser.test(['The module is licensed under BSD'].join('\n'))[0]
        , APA = parser.test(['The module is licensed under Apache License'].join('\n'))[0]
        , MPL = parser.test(['The module is licensed under MPL'].join('\n'))[0]
        , WTFPL = parser.test(['The module is licensed under WTFPL'].join('\n'))[0]
        , WTFPLL = parser.test(['The module is licensed under DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE'].join('\n'))[0];

      assume(MIT).equals('MIT');
      assume(GLP).equals('GPL');
      assume(LGPL).equals('LGPL');
      assume(BSD).equals('BSD');
      assume(APA).equals('Apache');
      assume(MPL).equals('MPL');
      assume(WTFPL).equals('WTFPL');
      assume(WTFPLL).equals('WTFPL');
    });
  });

  describe('#dual', function () {
    it('removes duplicates', function () {
      assume(parser.dual(['MIT', 'MIT']).join('')).to.equal('MIT');
      assume(parser.dual(['MIT,MIT']).join('')).to.equal('MIT');
    });

    it('understands MIT and GPL', function () {
      assume(parser.dual(['MIT and GPL']).join(':')).to.equal('MIT:GPL');
    });

    it('understands MIT or GPL', function () {
      assume(parser.dual(['MIT or GPL']).join(':')).to.equal('MIT:GPL');
    });

    it('understands MIT/GPL', function () {
      assume(parser.dual(['MIT / GPL']).join(':')).to.equal('MIT:GPL');
      assume(parser.dual(['MIT/GPL']).join(':')).to.equal('MIT:GPL');
    });

    it('understands MIT, GPL', function () {
      assume(parser.dual(['MIT , GPL']).join(':')).to.equal('MIT:GPL');
      assume(parser.dual(['MIT,GPL']).join(':')).to.equal('MIT:GPL');
    });

    it('requires spaces the and or keywords', function () {
      assume(parser.dual(['MITandGPL']).join(':')).to.equal('MITandGPL');
      assume(parser.dual(['MITorGPL']).join(':')).to.equal('MITorGPL');
    });

    it('does not dual parse as dual license if it can be normalized', function () {
      assume(parser.dual(['Apache, Version 2.0']).join(':')).to.equal('Apache, Version 2.0');
    });
  });

  describe('#url', function () {
    it('detects urls in strings', function () {
      assume(parser.url('http://github.com', 'github.com')).to.equal('http://github.com');
      assume(parser.url('http://google.com', 'github.com')).to.equal(undefined);
    });

    it('looks for url properties', function () {
      assume(parser.url({
        url: 'http://github.com'
      }, 'github.com')).to.equal('http://github.com');
      assume(parser.url({ foo: 'github.com' }, 'github.com')).to.equal(undefined);
    });

    it('looks for web properties', function () {
      assume(parser.url({
        web: 'http://github.com'
      }, 'github.com')).to.equal('http://github.com');
      assume(parser.url({ foo: 'github.com' }, 'github.com')).to.equal(undefined);
    });

    it('ignores other types', function () {
      parser.url([], 'github');
      parser.url(function () {}, 'github');
      parser.url(1, 'github');
    });
  });

  describe('#tokenizer', function () {
    it('it transforms it all to lowercase', function () {
      assume(parser.tokenizer('foObAr')).to.equal('foobar');
      assume(parser.tokenizer('h3lL0W0rlD')).to.equal('h3ll0w0rld');
    });

    it('removes all non chars', function () {
      assume(parser.tokenizer('hello world')).to.equal('helloworld');
      assume(parser.tokenizer('hello world.')).to.equal('helloworld');
      assume(parser.tokenizer('hello,world/')).to.equal('helloworld');
      assume(parser.tokenizer('hello,world')).to.equal('helloworld');
    });

    it('concats it all in to one line', function () {
      assume(parser.tokenizer('hello\nworld')).to.equal('helloworld');
      assume(parser.tokenizer('hello\r\nworld')).to.equal('helloworld');
      assume(parser.tokenizer('hello\rworld')).to.equal('helloworld');
    });

    it('combines it in to arrays of concatinated words', function () {
      assume(parser.tokenizer('hello WORLD', 2)).to.deep.equal([
        'helloworld'
      ]);

      assume(parser.tokenizer('hello WORLD', 1)).to.deep.equal([
        'hello',
        'world'
      ]);
    });
  });

  describe('actual detection', function () {
    //
    // Bump the timeout limit for these tests as we need to resolve a lot of
    // information and API endpoints in order to get accurate information.
    //
    this.timeout(20000);

    it('detects multiple licenses for metawidget', function (next) {
      licenses('metawidget', { npmjs: npmjs }, function resolved(err, licenses) {
        if (err) return next(err);

        assume(licenses.length).to.equal(3);

        assume(licenses).to.include('LGPL');
        assume(licenses).to.include('EPL');
        assume(licenses).to.include('Commercial');

        next();
      });
    });

    it('detects MIT for eventemitter3', function (next) {
      licenses('eventemitter3', { npmjs: npmjs }, function resolved(err, licenses) {
        if (err) return next(err);

        assume(licenses.length).to.equal(1);
        assume(licenses).to.include('MIT');

        next();
      });
    });
  });
});
