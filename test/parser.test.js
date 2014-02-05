describe('Parser', function () {
  'use strict';

  var chai = require('chai')
    , expect = chai.expect;

  var Parser = require('../').Parser
    , parser = new Parser();

  it('exposes the `async` module', function () {
    expect(parser.async).to.equal(require('async'));
  });

  it('exposes the `request` module', function () {
    expect(parser.request).to.equal(require('request'));
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
  });
});
