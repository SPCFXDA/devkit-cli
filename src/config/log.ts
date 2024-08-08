import { LogConfig } from '../types.ts'
import { ConfluxConfig } from './env.ts'
/**
 * Generates a logging configuration based on the provided environment.
 *
 * @class
 * @param {ConfluxConfig} env - The environment configuration used to generate the logging configuration.
 */
class LogConfigGenerator {
	private env: ConfluxConfig

	/**
	 * Creates an instance of LogConfigGenerator.
	 *
	 * @param {ConfluxConfig} env - The environment configuration.
	 */
	constructor(env: ConfluxConfig) {
		this.env = env
	}

	/**
	 * Generates the logging configuration with specified settings for appenders, root logger, and individual loggers.
	 *
	 * @returns {LogConfig} The generated logging configuration.
	 *
	 * @example
	 * const generator = new LogConfigGenerator(envConfig);
	 * const config = generator.generateConfig();
	 */
	generateConfig(): LogConfig {
		return {
			refresh_rate: '30 seconds',
			appenders: {
				logfile: {
					kind: 'rolling_file',
					path: this.env.LOG_FILE,
					encoder: {
						pattern: '{d} {h({l}):5.5} {T:<20.20} {t:12.12} - {m:.20000}{n}',
					},
					policy: {
						kind: 'compound',
						trigger: {
							kind: 'size',
							limit: '2000 mb',
						},
						roller: {
							kind: 'fixed_window',
							pattern: this.env.LOG_ARCHIVE,
							count: 50,
						},
					},
				},
			},
			root: {
				level: 'info',
				appenders: [
					'logfile',
				],
			},
			loggers: {
				network: {
					level: 'info',
				},
				cfxcore: {
					level: 'info',
				},
				rpc: {
					level: 'info',
				},
				blockgen: {
					level: 'info',
				},
				client: {
					level: 'info',
				},
				cfx_storage: {
					level: 'info',
				},
				cfx_statedb: {
					level: 'info',
				},
			},
		}
	}
}

export { LogConfigGenerator }
