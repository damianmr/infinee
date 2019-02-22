import { expect } from 'chai';
import { fromCString, toCString } from '../../src/util/nullString';

describe('Dealing with C/C++ null terminated strings', () => {
  it('should add "\\u0000" to strings', () => {
    expect(toCString('a').length).to.be.equal(2);
    expect(toCString('a')).to.be.eql('a\u0000');
  });

  it('it does not add \\u0000 if its already there', () => {
    expect(toCString('a\u0000').length).to.be.eql(2);
    expect(toCString('a\u0000')).to.be.eql('a\u0000');
  });

  it('should remove trailling "\\u0000" from strings', () => {
    expect(fromCString('a\u0000')).to.be.eql('a');
  });
});
