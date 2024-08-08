import { join } from '@std/path'
import { PosConfig } from '../types.ts'
import { ConfluxConfig } from './env.ts' // Ensure the path is correct
/**
 * Generates a Proof of Stake (PoS) configuration based on the provided environment and chain ID.
 *
 * @class
 * @param {ConfluxConfig} env - The environment configuration used to generate the PoS configuration.
 * @param {number} chainId - The chain ID for the PoS configuration.
 */
class PosConfigGenerator {
	private env: ConfluxConfig
	private posConfig: PosConfig
	private chainId: number

	/**
	 * Creates an instance of PosConfigGenerator.
	 *
	 * @param {ConfluxConfig} env - The environment configuration.
	 * @param {number} chainId - The chain ID.
	 */
	constructor(env: ConfluxConfig, chainId: number) {
		this.env = env
		this.chainId = chainId
		this.posConfig = {
			base: {
				data_dir: this.env.POS_DATA,
				role: 'validator',
				waypoint: {
					from_config: '',
				},
			},
			consensus: {
				round_initial_timeout_ms: 60000,
				safety_rules: {
					service: {
						type: 'local',
					},
				},
			},
			execution: {
				genesis_file_location: this.env.POS_GENESIS,
			},
			logger: {
				file: this.env.POS_LOG,
				level: 'INFO',
			},
		}
	}

	/**
	 * Generates the PoS configuration by running the 'pos-genesis-tool' command and reading the waypoint configuration.
	 *
	 * @returns {PosConfig} The generated PoS configuration.
	 *
	 * @example
	 * const generator = new PosConfigGenerator(envConfig, 1);
	 * const config = generator.generateConfig();
	 */
	generateConfig(): PosConfig {
		const command = new Deno.Command('pos-genesis-tool', {
			args: [
				'random',
				'--initial-seed=0000000000000000000000000000000000000000000000000000000000000000',
				'--num-validator=1',
				'--num-genesis-validator=1',
				`--chain-id=${this.chainId}`,
			],
			cwd: this.env.POS_ROOT,
		})
		command.outputSync()

		this.posConfig.base.waypoint.from_config = Deno.readTextFileSync(
			join(this.env.POS_ROOT, 'waypoint_config'),
		).trim()
		return this.posConfig
	}
}

export { PosConfigGenerator }
