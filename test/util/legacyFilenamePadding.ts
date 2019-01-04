import { expect } from 'chai';
import { pad, unpad } from '../../src/util/legacyFilenamePadding';

describe('Padding in legacy filenames', () => {

  it('should add "\\u0000" to strings', () => {
    expect(pad('h', 8)).to.be.equal('h\u0000\u0000\u0000\u0000\u0000\u0000\u0000');
    expect(pad('he', 8)).to.be.equal('he\u0000\u0000\u0000\u0000\u0000\u0000');
    expect(pad('hel', 8)).to.be.equal('hel\u0000\u0000\u0000\u0000\u0000');
    expect(pad('hell', 8)).to.be.equal('hell\u0000\u0000\u0000\u0000');
    expect(pad('Hello W', 8)).to.be.equal('Hello W\u0000');
    expect(pad('Hello World', 8)).to.be.equal('Hello Wo');
  });

  it('should remove "\\u0000" from strings', () => {
    expect(unpad('h\u0000\u0000\u0000\u0000\u0000\u0000\u0000')).to.be.equal('h');
    expect(unpad('he\u0000\u0000\u0000\u0000\u0000\u0000')).to.be.equal('he');
    expect(unpad('hell\u0000\u0000\u0000\u0000\u0000')).to.be.equal('hell');
    expect(unpad('Hello W ')).to.be.equal('Hello W ');
    expect(unpad('Hello World')).to.be.equal('Hello World');
  });

});