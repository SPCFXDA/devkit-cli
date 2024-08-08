import { NodeConfig } from '../types.ts'
import { ConfluxConfig } from './env.ts'
/**
 * Generates a development configuration for a node based on the provided environment.
 *
 * @class
 * @param {ConfluxConfig} env - The environment configuration used to generate the development configuration.
 */
class DevConfigGenerator {
	private env: ConfluxConfig

	/**
	 * Creates an instance of DevConfigGenerator.
	 *
	 * @param {ConfluxConfig} env - The environment configuration.
	 */
	constructor(env: ConfluxConfig) {
		this.env = env
	}

	/**
	 * Generates the development configuration with specific settings for node operation.
	 *
	 * @returns {NodeConfig} The generated development configuration.
	 *
	 * @example
	 * const generator = new DevConfigGenerator(envConfig);
	 * const config = generator.generateConfig();
	 */
	generateConfig(): NodeConfig {
		return {
			mode: 'dev',
			dev_block_interval_ms: 500,
			genesis_secrets: this.env.SECRETS_PATH,
			pos_config_path: this.env.POS_CONFIG,
			pos_initial_nodes_path: this.env.POS_NODES,
			pos_private_key_path: this.env.POS_KEY,
			dev_pos_private_key_encryption_password: this.env.POS_KEY_PWD,
			mining_author: '',
			log_conf: this.env.LOG_CONFIG,
			jsonrpc_ws_port: 12535,
			jsonrpc_http_port: 12537,
			jsonrpc_local_http_port: 12539,
			jsonrpc_http_eth_port: 8545,
			jsonrpc_ws_eth_port: 8546,
			public_rpc_apis: 'all',
			public_evm_rpc_apis: 'evm,ethdebug',
			poll_lifetime_in_seconds: 60,
			persist_block_number_index: true,
			persist_tx_index: true,
			conflux_data_dir: this.env.NODE_DATA,
			executive_trace: true,
			get_logs_filter_max_limit: 5000,
			chain_id: this.env.CHAIN_ID,
			evm_chain_id: this.env.EVM_CHAIN_ID,
			node_table_promotion_timeout_s: 9600,
			hydra_transition_number: 5,
			hydra_transition_height: 5,
			cip43_init_end_number: 5,
			pos_reference_enable_height: 5,
			dao_vote_transition_number: 6,
			dao_vote_transition_height: 6,
			cip78_patch_transition_number: 6,
			cip90_transition_height: 6,
			cip90_transition_number: 6,
			cip105_transition_number: 6,
			sigma_fix_transition_number: 6,
			cip107_transition_number: 7,
			cip112_transition_height: 7,
			cip118_transition_number: 7,
			cip119_transition_number: 7,
			cip1559_transition_height: 10,
			cancun_opcodes_transition_number: 10,
			next_hardfork_transition_number: 10,
			next_hardfork_transition_height: 10,
		}
	}
}

export { DevConfigGenerator }
