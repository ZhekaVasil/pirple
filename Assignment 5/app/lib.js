/**
 *  Library class
 *  @class Lib
 */
class Lib {
  /**
   * Return number method
   *
   * @type Function
   * @memberOf Lib
   * @return Number
   */
  static returnNumber(){
    return Math.random();
  }
  
  /**
   * Check if number method
   *
   * @type Function
   * @param {Number} number Number to check
   * @memberOf Lib
   * @return Boolean
   */
  static isNumber(number) {
    return Number.isFinite(number);
  }
  
  /**
   * Check if string is palindrome
   *
   * @type Function
   * @param {String} string String to check
   * @memberOf Lib
   * @return Boolean
   */
  static isStringPalindrome(string) {
    return string.toLowerCase().split('').reverse().join('') === string.toLowerCase();
  }
  
  /**
   * Check if string is on English
   *
   * @type Function
   * @param {String} string String to check
   * @memberOf Lib
   * @return Boolean
   */
  static isEnglish(string) {
    return /^[a-zA-Z\s]+$/.test(string);
  }
  
  /**
   * Check if string is an Ocean name
   *
   * @type Function
   * @param {String} string String to check
   * @memberOf Lib
   * @return Boolean
   */
  static isOcean(string) {
    const oceans = [
      'pacific',
      'atlantic',
      'indian',
      'arctic'
    ];
    
    return oceans.includes(string.toLowerCase().trim())
  };
}

module.exports = Lib;
