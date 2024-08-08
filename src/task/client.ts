import TreeGraph from 'js-conflux-sdk'
import { Address, createPublicClient, formatEther, http, isAddress, PublicClient } from 'viem'
import { NodeTask } from './node.ts'
import { delay } from '@std/async/delay'

import { ChainStatus } from '../types.ts'

/**
 * Manages interaction with Conflux and ESpace blockchains.
 * Extends NodeTask to include functionality for blockchain operations.
 *
 * @extends NodeTask
 */
export class ClientTask extends NodeTask {
	/** Conflux client for interacting with the Conflux blockchain. */
	confluxClient: TreeGraph.Conflux

	/** Viem client for interacting with the Ethereum-compatible blockchain. */
	viemClient: PublicClient

	/** Retry count for fetching status. */
	retryCount: number

	/** Delay in milliseconds between retries. */
	delayMs: number

	/** Format Ether balance utility. */
	formatEther: typeof formatEther

	/**
	 * Constructs a new instance of ClientTask and initializes clients for Conflux and Ethereum-compatible blockchains.
	 */
	constructor() {
		super()

		// Initialize Conflux client
		this.confluxClient = new TreeGraph.Conflux({
			url: `http://localhost:${this.config.jsonrpc_http_port}`,
			networkId: this.config.chain_id,
		})

		// Initialize Viem client
		this.viemClient = createPublicClient({
			pollingInterval: this.config.dev_block_interval_ms,
			transport: http(
				`http://localhost:${this.config.jsonrpc_http_eth_port}`,
			),
		})
		this.retryCount = 5
		this.delayMs = 3000
		this.formatEther = formatEther
	}

	/**
	 * Runs the task by setting up the environment and executing the task logic.
	 *
	 * @param {Record<string, unknown>} [options] - Optional parameters for the task execution.
	 * @returns {Promise<void>} A promise that resolves when the task is complete.
	 */
	async run(options?: Record<string, unknown> | undefined): Promise<void> {
		try {
			return await this.execute(options)
		} catch (error: unknown) {
			console.error('Error executing task:', this.formatError(error))
		}
	}

	/**
	 * Retrieves the balance of a given Core address from the Conflux blockchain.
	 *
	 * @param {string} address - The Core address to fetch the balance for.
	 * @returns {Promise<string>} A promise that resolves with the balance of the address in Core units.
	 * @throws {Error} Throws an error if fetching the balance fails.
	 */
	async getCoreBalance(address: string): Promise<string> {
		try {
			const balance = await this.confluxClient.cfx.getBalance(address)
			return new TreeGraph.Drip(balance).toCFX()
		} catch (error) {
			console.error(
				'Error fetching Core balance:',
				this.formatError(error),
			)
			throw error
		}
	}

	/**
	 * Retrieves the balance of a given ESpace address from the Ethereum-compatible blockchain.
	 *
	 * @param {string} address - The ESpace address to fetch the balance for.
	 * @returns {Promise<string>} A promise that resolves with the balance of the address in Ether units.
	 * @throws {Error} Throws an error if fetching the balance fails.
	 */
	async getESpaceBalance(address: string): Promise<string> {
		try {
			const balance = await this.viemClient.getBalance({
				address: address as Address,
			})
			return formatEther(balance)
		} catch (error) {
			console.error(
				'Error fetching ESpace balance:',
				this.formatError(error),
			)
			throw error
		}
	}

	/**
	 * Converts a Core balance from Core units to the Drip unit.
	 *
	 * @param {string | number | bigint} cfx - The Core balance to convert.
	 * @returns {string} The balance converted to Drip units.
	 */
	fromCfx(cfx: string | number | bigint): string {
		return TreeGraph.Drip.fromCFX(cfx) as unknown as string
	}

	/**
	 * Checks if a given address is a valid Core address.
	 *
	 * @param {string} address - The address to validate.
	 * @returns {boolean} True if the address is a valid Core address, otherwise false.
	 */
	isCoreAddress(address: string): boolean {
		return TreeGraph.address.isValidCfxAddress(address)
	}

	/**
	 * Checks if a given address is a valid ESpace address.
	 *
	 * @param {string} address - The address to validate.
	 * @returns {boolean} True if the address is a valid ESpace address, otherwise false.
	 */
	isEspaceAddress(address: string): boolean {
		return isAddress(address)
	}

	/**
	 * Retrieves the current status of the Conflux blockchain.
	 * Retries up to 5 times with a 3-second delay between attempts if fetching the status fails.
	 *
	 * @returns {Promise<ChainStatus>} A promise that resolves with the current chain status.
	 * @throws {Error} Throws an error if the node process is not found or if fetching the status fails after multiple attempts.
	 */
	async status(): Promise<ChainStatus> {
		const pid = this.getPid()
		if (!pid) {
			throw new Error('Node process not found')
		}

		for (let attempt = 1; attempt <= this.retryCount; attempt++) {
			try {
				return await this.confluxClient.cfx.getStatus()
			} catch (error: unknown) {
				if (attempt < this.retryCount) {
					await delay(this.delayMs)
				} else {
					throw error
				}
			}
		}

		throw new Error('Failed to fetch status after multiple attempts.')
	}
}
