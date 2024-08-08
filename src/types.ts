// Define TypeScript interfaces for Pos Configuration

/**
 * Represents the waypoint configuration for POS.
 *
 * @interface Waypoint
 * @property {string} from_config - Path or identifier for the waypoint configuration.
 */
interface Waypoint {
	from_config: string
}

/**
 * Represents the service configuration for safety rules.
 *
 * @interface SafetyRulesService
 * @property {string} type - The type of the safety rules service (e.g., 'local').
 */
interface SafetyRulesService {
	type: string
}

/**
 * Represents the safety rules configuration in POS.
 *
 * @interface SafetyRules
 * @property {SafetyRulesService} service - The service configuration for safety rules.
 */
interface SafetyRules {
	service: SafetyRulesService
}

/**
 * Represents the consensus configuration for POS.
 *
 * @interface Consensus
 * @property {number} round_initial_timeout_ms - The initial timeout in milliseconds for a consensus round.
 * @property {SafetyRules} safety_rules - The safety rules configuration.
 */
interface Consensus {
	round_initial_timeout_ms: number
	safety_rules: SafetyRules
}

/**
 * Represents the execution configuration for POS.
 *
 * @interface Execution
 * @property {string} genesis_file_location - Path to the genesis file.
 */
interface Execution {
	genesis_file_location: string
}

/**
 * Represents the logger configuration for POS.
 *
 * @interface Logger
 * @property {string} file - Path to the log file.
 * @property {string} level - Logging level (e.g., 'INFO', 'DEBUG').
 */
interface Logger {
	file: string
	level: string
}

/**
 * Represents the base configuration for POS.
 *
 * @interface Base
 * @property {string} data_dir - Directory path for data storage.
 * @property {string} role - Role of the POS node (e.g., 'validator').
 * @property {Waypoint} waypoint - Waypoint configuration.
 */
interface Base {
	data_dir: string
	role: string
	waypoint: Waypoint
}

/**
 * Interface representing the POS configuration.
 *
 * @interface PosConfig
 * @property {Base} base - The base configuration.
 * @property {Consensus} consensus - The consensus configuration.
 * @property {Execution} execution - The execution configuration.
 * @property {Logger} logger - The logger configuration.
 * @property {Object} [storage] - Optional storage configuration.
 * @property {string} [storage.dir] - Directory path for storage if configured.
 */
export interface PosConfig {
	base: Base
	consensus: Consensus
	execution: Execution
	logger: Logger
	// storage?: { dir: string }; // Uncomment this if you need the storage configuration
}

// logConfigTypes.ts

/**
 * Represents the encoder configuration for logging.
 *
 * @interface Encoder
 * @property {string} pattern - The pattern used by the encoder for log formatting.
 */
export interface Encoder {
	pattern: string
}

/**
 * Represents a filter configuration for logging.
 *
 * @interface Filter
 * @property {string} kind - The type of the filter (e.g., 'threshold').
 * @property {string} level - The log level for the filter (e.g., 'info').
 */
export interface Filter {
	kind: string
	level: string
}

/**
 * Represents the trigger configuration for a logging policy.
 *
 * @interface Trigger
 * @property {string} kind - The type of trigger (e.g., 'size').
 * @property {string} limit - The limit for the trigger (e.g., '2000 mb').
 */
export interface Trigger {
	kind: string
	limit: string
}

/**
 * Represents the roller configuration for a logging policy.
 *
 * @interface Roller
 * @property {string} kind - The type of roller (e.g., 'fixed_window').
 * @property {string} pattern - The pattern for the roller's filename.
 * @property {number} count - The number of archived files to keep.
 */
export interface Roller {
	kind: string
	pattern: string
	count: number
}

/**
 * Represents a policy configuration for logging.
 *
 * @interface Policy
 * @property {string} kind - The type of policy (e.g., 'compound').
 * @property {Trigger} trigger - The trigger configuration for the policy.
 * @property {Roller} roller - The roller configuration for the policy.
 */
export interface Policy {
	kind: string
	trigger: Trigger
	roller: Roller
}

/**
 * Represents the logfile appender configuration for logging.
 *
 * @interface LogfileAppender
 * @property {string} kind - The type of appender (e.g., 'rolling_file').
 * @property {string} path - The path to the log file.
 * @property {Encoder} encoder - The encoder configuration.
 * @property {Policy} policy - The policy configuration for log rotation.
 */
export interface LogfileAppender {
	kind: string
	path: string
	encoder: Encoder
	policy: Policy
}

/**
 * Represents the root logger configuration.
 *
 * @interface Root
 * @property {string} level - The log level for the root logger (e.g., 'info').
 * @property {string[]} appenders - The list of appenders used by the root logger.
 */
export interface Root {
	level: string
	appenders: string[]
}

/**
 * Represents the loggers configuration for different categories.
 *
 * @interface Loggers
 * @property {Object.<string, { level: string }>} [key] - Key-value pairs where each key is a logger category and the value is an object specifying the log level.
 */
export interface Loggers {
	[key: string]: {
		level: string
	}
}

/**
 * Interface representing the logging configuration.
 *
 * @interface LogConfig
 * @property {string} refresh_rate - The rate at which logs are refreshed.
 * @property {Object} appenders - Configuration for log appenders.
 * @property {LogfileAppender} appenders.logfile - Configuration for the logfile appender.
 * @property {Root} root - The root logger configuration.
 * @property {Loggers} loggers - The configuration for different loggers.
 */
export interface LogConfig {
	refresh_rate: string
	appenders: {
		logfile: LogfileAppender
	}
	root: Root
	loggers: Loggers
}

// config.ts

/**
 * Interface representing the configuration for the node.
 *
 * @interface NodeConfig
 * @property {string} mode - Operating mode of the node (e.g., 'production', 'test').
 * @property {number} dev_block_interval_ms - Block interval in milliseconds for development mode.
 * @property {string} genesis_secrets - Path to the genesis secrets file.
 * @property {string} pos_config_path - Path to the POS configuration file.
 * @property {string} pos_initial_nodes_path - Path to the file with initial POS nodes.
 * @property {string} pos_private_key_path - Path to the file with POS private keys.
 * @property {string} dev_pos_private_key_encryption_password - Encryption password for POS private keys in development mode.
 * @property {string} mining_author - Author of the mining configuration.
 * @property {string} log_conf - Path to the logging configuration file.
 * @property {number} jsonrpc_ws_port - Port for JSON-RPC over WebSocket.
 * @property {number} jsonrpc_http_port - Port for JSON-RPC over HTTP.
 * @property {number} jsonrpc_local_http_port - Port for local JSON-RPC over HTTP.
 * @property {number} jsonrpc_http_eth_port - Port for JSON-RPC over HTTP for Ethereum.
 * @property {number} jsonrpc_ws_eth_port - Port for JSON-RPC over WebSocket for Ethereum.
 * @property {string} public_rpc_apis - List of public RPC APIs.
 * @property {string} public_evm_rpc_apis - List of public EVM RPC APIs.
 * @property {number} poll_lifetime_in_seconds - Polling lifetime in seconds.
 * @property {boolean} persist_block_number_index - Flag to indicate if block number index should be persisted.
 * @property {boolean} persist_tx_index - Flag to indicate if transaction index should be persisted.
 * @property {string} conflux_data_dir - Directory path for Conflux data.
 * @property {boolean} executive_trace - Flag to enable executive trace.
 * @property {number} get_logs_filter_max_limit - Maximum limit for log filters.
 * @property {number} chain_id - ID of the blockchain chain.
 * @property {number} evm_chain_id - EVM chain ID.
 * @property {number} node_table_promotion_timeout_s - Timeout for node table promotion in seconds.
 * @property {number} hydra_transition_number - Transition number for Hydra.
 * @property {number} hydra_transition_height - Transition height for Hydra.
 * @property {number} cip43_init_end_number - Transition number for CIP43 initialization end.
 * @property {number} pos_reference_enable_height - Height at which POS reference is enabled.
 * @property {number} dao_vote_transition_number - Transition number for DAO vote.
 * @property {number} dao_vote_transition_height - Transition height for DAO vote.
 * @property {number} cip78_patch_transition_number - Transition number for CIP78 patch.
 * @property {number} cip90_transition_height - Transition height for CIP90.
 * @property {number} cip90_transition_number - Transition number for CIP90.
 * @property {number} cip105_transition_number - Transition number for CIP105.
 * @property {number} sigma_fix_transition_number - Transition number for Sigma fix.
 * @property {number} cip107_transition_number - Transition number for CIP107.
 * @property {number} cip112_transition_height - Transition height for CIP112.
 * @property {number} cip118_transition_number - Transition number for CIP118.
 * @property {number} cip119_transition_number - Transition number for CIP119.
 * @property {number} cip1559_transition_height - Transition height for CIP1559.
 * @property {number} cancun_opcodes_transition_number - Transition number for Cancun opcodes.
 * @property {number} next_hardfork_transition_number - Transition number for the next hard fork.
 * @property {number} next_hardfork_transition_height - Transition height for the next hard fork.
 */
export interface NodeConfig {
	mode: string
	dev_block_interval_ms: number
	genesis_secrets: string
	pos_config_path: string
	pos_initial_nodes_path: string
	pos_private_key_path: string
	dev_pos_private_key_encryption_password: string
	mining_author: string
	log_conf: string
	jsonrpc_ws_port: number
	jsonrpc_http_port: number
	jsonrpc_local_http_port: number
	jsonrpc_http_eth_port: number
	jsonrpc_ws_eth_port: number
	public_rpc_apis: string
	public_evm_rpc_apis: string
	poll_lifetime_in_seconds: number
	persist_block_number_index: boolean
	persist_tx_index: boolean
	conflux_data_dir: string
	executive_trace: boolean
	get_logs_filter_max_limit: number
	chain_id: number
	evm_chain_id: number
	node_table_promotion_timeout_s: number
	hydra_transition_number: number
	hydra_transition_height: number
	cip43_init_end_number: number
	pos_reference_enable_height: number
	dao_vote_transition_number: number
	dao_vote_transition_height: number
	cip78_patch_transition_number: number
	cip90_transition_height: number
	cip90_transition_number: number
	cip105_transition_number: number
	sigma_fix_transition_number: number
	cip107_transition_number: number
	cip112_transition_height: number
	cip118_transition_number: number
	cip119_transition_number: number
	cip1559_transition_height: number
	cancun_opcodes_transition_number: number
	next_hardfork_transition_number: number
	next_hardfork_transition_height: number
}

/**
 * Type representing the status of the blockchain.
 *
 * @typedef {Object} ChainStatus
 * @property {string} bestHash - The hash of the best block.
 * @property {number} blockNumber - The current block number.
 * @property {number} chainId - The ID of the chain.
 * @property {number} epochNumber - The current epoch number.
 * @property {number} ethereumSpaceChainId - Ethereum Space chain ID.
 * @property {number} latestCheckpoint - The latest checkpoint number.
 * @property {number} latestConfirmed - The latest confirmed block number.
 * @property {number} latestFinalized - The latest finalized block number.
 * @property {number} latestState - The latest state number.
 * @property {number} networkId - The network ID.
 * @property {number} pendingTxNumber - The number of pending transactions.
 */
export type ChainStatus = {
	bestHash: string
	blockNumber: number
	chainId: number
	epochNumber: number
	ethereumSpaceChainId: number
	latestCheckpoint: number
	latestConfirmed: number
	latestFinalized: number
	latestState: number
	networkId: number
	pendingTxNumber: number
}

/**
 * Interface representing the structure of the log configuration.
 *
 * @interface
 */
export interface LogConfigType {
	/**
	 * Append configurations for logging.
	 *
	 * @property {object} appenders - Object containing appenders configurations.
	 * @property {object} appenders.logfile - Configuration for the logfile appender.
	 * @property {string} appenders.logfile.path - Path to the log file.
	 */
	appenders: {
		logfile: {
			path: string
		}
	}
}
