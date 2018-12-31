/**
 * App config class
 * (includes settings for STAGE and PROD environments)
 */

class Config {
  /**
   * Available configs
   *
   * @memberOf Config
   * @return {Object} Object with Available configs
   */
  static get configs() {
    return {
      // STAGE env
      staging: {
        httpPort: 3000,
        httpsPort: 3001,
        envName: 'staging'
      },
  
      // PROD env
      production: {
        httpPort: 5000,
        httpsPort: 5001,
        envName: 'production'
      }
    }
  }
  
  /**
   * Get config based on NODE_ENV
   *
   * @memberOf Config
   * @return {Object} Config based on NODE_ENV
   */
  static get envConfig() {
    // Get current env name based on NODE_ENV
    const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

    // Return env specific config
    return typeof Config.configs[currentEnvironment] === 'object' ? Config.configs[currentEnvironment] : Config.configs.staging;
  }
}

// Export env specific config
module.exports = Config.envConfig;