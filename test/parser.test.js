describe('Parser', function () {
  'use strict';

  var chai = require('chai')
    , expect = chai.expect;

  var Parser = require('../').Parser
    , parser = new Parser();

  it('exposes the `async` module', function () {
    expect(parser.async).to.equal(require('async'));
  });

  describe('#test', function () {
    it('provides basic checks of license fragments');
  });

  describe('#dual', function () {
    it('removes duplicates', function () {
      expect(parser.dual(['MIT', 'MIT']).join('')).to.equal('MIT');
      expect(parser.dual(['MIT,MIT']).join('')).to.equal('MIT');
    });

    it('understands MIT and GPL', function () {
      expect(parser.dual(['MIT and GPL']).join(':')).to.equal('MIT:GPL');
    });

    it('understands MIT or GPL', function () {
      expect(parser.dual(['MIT or GPL']).join(':')).to.equal('MIT:GPL');
    });

    it('understands MIT/GPL', function () {
      expect(parser.dual(['MIT / GPL']).join(':')).to.equal('MIT:GPL');
      expect(parser.dual(['MIT/GPL']).join(':')).to.equal('MIT:GPL');
    });

    it('understands MIT, GPL', function () {
      expect(parser.dual(['MIT , GPL']).join(':')).to.equal('MIT:GPL');
      expect(parser.dual(['MIT,GPL']).join(':')).to.equal('MIT:GPL');
    });

    it('requires spaces the and or keywords', function () {
      expect(parser.dual(['MITandGPL']).join(':')).to.equal('MITandGPL');
      expect(parser.dual(['MITorGPL']).join(':')).to.equal('MITorGPL');
    });
  });

  describe('#url', function () {
    it('detects urls in strings', function () {
      expect(parser.url('http://github.com', 'github.com')).to.equal('http://github.com');
      expect(parser.url('http://google.com', 'github.com')).to.equal(undefined);
    });

    it('looks for url properties', function () {
      expect(parser.url({
        url: 'http://github.com'
      }, 'github.com')).to.equal('http://github.com');
      expect(parser.url({ foo: 'github.com' }, 'github.com')).to.equal(undefined);
    });

    it('looks for web properties', function () {
      expect(parser.url({
        web: 'http://github.com'
      }, 'github.com')).to.equal('http://github.com');
      expect(parser.url({ foo: 'github.com' }, 'github.com')).to.equal(undefined);
    });

    it('ignores other types', function () {
      parser.url([], 'github');
      parser.url(function () {}, 'github');
      parser.url(1, 'github');
    });
  });

  describe('#tokenizer', function () {
    it('it transforms it all to lowercase', function () {
      expect(parser.tokenizer('foObAr')).to.equal('foobar');
      expect(parser.tokenizer('h3lL0W0rlD')).to.equal('h3ll0w0rld');
    });

    it('removes all non chars', function () {
      expect(parser.tokenizer('hello world')).to.equal('helloworld');
      expect(parser.tokenizer('hello world.')).to.equal('helloworld');
      expect(parser.tokenizer('hello,world/')).to.equal('helloworld');
      expect(parser.tokenizer('hello,world')).to.equal('helloworld');
    });

    it('concats it all in to one line', function () {
      expect(parser.tokenizer('hello\nworld')).to.equal('helloworld');
      expect(parser.tokenizer('hello\r\nworld')).to.equal('helloworld');
      expect(parser.tokenizer('hello\rworld')).to.equal('helloworld');
    });

    it('combines it in to arrays of concatinated words', function () {
      expect(parser.tokenizer('hello WORLD', 2)).to.deep.equal([
        'helloworld'
      ]);

      expect(parser.tokenizer('hello WORLD', 1)).to.deep.equal([
        'hello',
        'world'
      ]);
    });
  });
});
