const lib = require('./../app/lib');
const assert = require('assert');

/**
 *  Unit tests class
 *  @class Lib
 */
class Unit {
  /**
   * Test list
   *
   * @memberOf Unit
   */
  static get tests() {
    return [
      {
        name: 'returnNumber should return number',
        method: Unit.returnNumberTest
      },
      {
        name: '"Redder" should be palindrome',
        method: Unit.palindromeTest
      },
      {
        name: '"Pacific" should be an ocean\'s name',
        method: Unit.oceanTest
      },
      {
        name: '"My name is Eugene" should be in English',
        method: Unit.englishTest
      },
      {
        name: '"Меня зовут Женя" should be in English',
        method: Unit.englishTestFail
      },
      {
        name: '"Hello" should be palindrome',
        method: Unit.palindromeTestFail
      },
      {
        name: '"Big ocean" should be an ocean\'s name',
        method: Unit.oceanTestFail
      }
    ];
  }
  
  /**
   * Test for english string
   *
   * @memberOf Unit
   */
  static englishTest() {
    assert.ok(lib.isEnglish('My name is Eugene'));
  }
  
  /**
   * Test for english string
   *
   * @memberOf Unit
   */
  static englishTestFail() {
    assert.ok(lib.isEnglish('Меня зовут Женя'));
  }
  
  /**
   * Test for ocean name
   *
   * @memberOf Unit
   */
  static oceanTest() {
    assert.ok(lib.isOcean('Pacific'));
  }
  
  /**
   * Test for ocean name
   *
   * @memberOf Unit
   */
  static oceanTestFail() {
    assert.ok(lib.isOcean('Big ocean'));
  }
  
  /**
   * Test for number
   *
   * @memberOf Unit
   */
  static returnNumberTest() {
    assert.ok(lib.isNumber(lib.returnNumber()));
  }
  
  /**
   * Test for palindrome
   *
   * @memberOf Unit
   */
  static palindromeTest() {
    assert.ok(lib.isStringPalindrome('Redder'));
  }
  
  /**
   * Test for palindrome
   *
   * @memberOf Unit
   */
  static palindromeTestFail() {
    assert.ok(lib.isStringPalindrome('Hello'));
  }
}

module.exports = Unit;
