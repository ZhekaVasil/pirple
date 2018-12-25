const Unit = require('./../test/unit');

/**
 * App class
 * @class App
 */

class App {
  constructor() {
    this.errors = [];
    this.totalTests = 0;
    this.testsPassed = 0;
    this.testsRejected = 0;
  }

  /**
   * Initialize test runner
   *
   * @memberOf App
   * @instance
   */
  init() {
    const tests = Unit.tests;
    this.totalTests = tests.length;
    
    tests.forEach(test => {
      this.runner(test);
    });
    
    // Print report
    this.printReport();
  }
  
  /**
   * Test runner
   *
   * @memberOf App
   * @instance
   */
  runner(test) {
    try {
      test.method();
      this.testsPassed++;
    } catch (error) {
      this.testsRejected++;
      this.errors.push({
        name: test.name,
        error
      })
    }
  }

  /**
   * Print test report
   *
   * @memberOf App
   * @instance
   */
  printReport() {
    console.log('');
    console.log('----------BEGIN TEST REPORT----------');
    console.log('');
    console.log('Total TESTS: ', this.totalTests);
    console.log('Pass: ', this.testsPassed);
    console.log('Fail: ', this.testsRejected);
    console.log('');
    if (this.errors.length) {
      console.log('----------BEGIN ERROR DETAILS----------');
      console.log('');
    
      this.errors.forEach(error => {
        console.log('\x1b[31m%s\x1b[0m', error.name);
        console.log(error.error);
        console.log('');
      });
    
      console.log('');
      console.log('----------END ERROR DETAILS----------');
    }
  
    console.log('');
    console.log('----------END TEST REPORT----------');
    process.exit(0);
  }
}

module.exports = App;