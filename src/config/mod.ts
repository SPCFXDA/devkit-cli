/**
 * Module exporting classes for generating various configurations and managing environment settings.
 *
 * @module
 *
 * @example
 * // Importing the configuration classes
 * import { DevConfigGenerator, PosConfigGenerator, LogConfigGenerator, ConfluxConfig } from './configModule';
 *
 * // Creating an instance of ConfluxConfig
 * const envConfig = new ConfluxConfig();
 *
 * // Generating a development configuration
 * const devConfigGenerator = new DevConfigGenerator(envConfig);
 * const devConfig = devConfigGenerator.generateConfig();
 *
 * // Generating a POS configuration
 * const posConfigGenerator = new PosConfigGenerator(envConfig, 1);
 * const posConfig = posConfigGenerator.generateConfig();
 *
 * // Generating a logging configuration
 * const logConfigGenerator = new LogConfigGenerator(envConfig);
 * const logConfig = logConfigGenerator.generateConfig();
 */
export { DevConfigGenerator } from './dev.ts'
export { PosConfigGenerator } from './pos.ts'
export { LogConfigGenerator } from './log.ts'
export { ConfluxConfig } from './env.ts'
