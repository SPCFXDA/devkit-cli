import { join } from '@std/path'

/**
 * Represents the configuration for a Conflux node, initialized from environment variables or default values.
 *
 * @class
 */
export class ConfluxConfig {
	readonly NODE_ROOT: string
	readonly CONFIG_PATH: string
	readonly SECRETS_PATH: string
	readonly NODE_DATA: string
	readonly CHAIN_ID: number
	readonly EVM_CHAIN_ID: number
	readonly LOG: string
	readonly LOG_CONFIG: string
	readonly LOG_FILE: string
	readonly LOG_ARCHIVE: string
	readonly POS_ROOT: string
	readonly POS_DATA: string
	readonly POS_GENESIS: string
	readonly POS_LOG: string
	readonly POS_CONFIG: string
	readonly POS_NODES: string
	readonly POS_KEY: string
	readonly POS_KEY_PWD: string

	/**
	 * Creates an instance of ConfluxConfig by reading environment variables or using default values.
	 *
	 * @constructor
	 */
	constructor() {
		this.NODE_ROOT = Deno.env.has('CONFLUX_NODE_ROOT')
			? Deno.env.get('CONFLUX_NODE_ROOT')!
			: join('/opt', 'conflux')
		this.CONFIG_PATH = Deno.env.has('CONFLUX_CONFIG_PATH')
			? Deno.env.get('CONFLUX_CONFIG_PATH')!
			: join(this.NODE_ROOT, 'develop.toml')
		this.SECRETS_PATH = Deno.env.has('CONFLUX_SECRETS_PATH')
			? Deno.env.get('CONFLUX_SECRETS_PATH')!
			: join(this.NODE_ROOT, 'secrets.txt')
		this.NODE_DATA = Deno.env.has('CONFLUX_NODE_DATA')
			? Deno.env.get('CONFLUX_NODE_DATA')!
			: join(this.NODE_ROOT, 'blockchain_data')
		this.CHAIN_ID = parseInt(
			Deno.env.has('CONFLUX_CHAIN_ID') ? Deno.env.get('CONFLUX_CHAIN_ID')! : '2029',
		)
		this.EVM_CHAIN_ID = parseInt(
			Deno.env.has('CONFLUX_EVM_CHAIN_ID') ? Deno.env.get('CONFLUX_EVM_CHAIN_ID')! : '2030',
		)
		this.LOG = Deno.env.has('CONFLUX_LOG') ? Deno.env.get('CONFLUX_LOG')! : join(this.NODE_ROOT, 'log')
		this.LOG_CONFIG = Deno.env.has('CONFLUX_LOG_CONFIG')
			? Deno.env.get('CONFLUX_LOG_CONFIG')!
			: join(this.NODE_ROOT, 'log.yaml')
		this.LOG_FILE = Deno.env.has('CONFLUX_LOG_FILE')
			? Deno.env.get('CONFLUX_LOG_FILE')!
			: join(this.LOG, 'conflux.log')
		this.LOG_ARCHIVE = Deno.env.has('CONFLUX_LOG_ARCHIVE')
			? Deno.env.get('CONFLUX_LOG_ARCHIVE')!
			: join(this.LOG, 'archive', 'conflux.{}.gz')
		this.POS_ROOT = Deno.env.has('CONFLUX_POS_ROOT')
			? Deno.env.get('CONFLUX_POS_ROOT')!
			: join(this.NODE_ROOT, 'pos_config')
		this.POS_DATA = Deno.env.has('CONFLUX_POS_DATA')
			? Deno.env.get('CONFLUX_POS_DATA')!
			: join(this.POS_ROOT, 'pos_db')
		this.POS_GENESIS = Deno.env.has('CONFLUX_POS_GENESIS')
			? Deno.env.get('CONFLUX_POS_GENESIS')!
			: join(this.POS_ROOT, 'genesis_file')
		this.POS_LOG = Deno.env.has('CONFLUX_POS_LOG') ? Deno.env.get('CONFLUX_POS_LOG')! : join(this.LOG, 'pos.log')
		this.POS_CONFIG = Deno.env.has('CONFLUX_POS_CONFIG')
			? Deno.env.get('CONFLUX_POS_CONFIG')!
			: join(this.POS_ROOT, 'pos_config.yaml')
		this.POS_NODES = Deno.env.has('CONFLUX_POS_NODES')
			? Deno.env.get('CONFLUX_POS_NODES')!
			: join(this.POS_ROOT, 'initial_nodes.json')
		this.POS_KEY = Deno.env.has('CONFLUX_POS_KEY')
			? Deno.env.get('CONFLUX_POS_KEY')!
			: join(this.POS_ROOT, 'pos_key')
		this.POS_KEY_PWD = Deno.env.has('CONFLUX_POS_KEY_PWD') ? Deno.env.get('CONFLUX_POS_KEY_PWD')! : 'CFXV20'
	}
}
