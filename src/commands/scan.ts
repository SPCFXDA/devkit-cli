import { Transaction as ConfluxTransaction } from 'js-conflux-sdk'
import Kia from 'kia'
import { blue, bold, green, yellow } from '@std/fmt/colors'
import { ClientTask } from '../task/mod.ts'
/**
 * Represents a task to scan and log blockchain transactions from Conflux Core and eSpace.
 * Extends the {@link ClientTask} class to handle real-time monitoring of blockchain transactions.
 *
 * @extends ClientTask
 */
export class Scan extends ClientTask {
	/**
	 * The latest block number for Conflux Core.
	 * @type {number}
	 */
	coreBlock: number

	/**
	 * The latest block number for eSpace.
	 * @type {bigint}
	 */
	espaceBlock: bigint

	/**
	 * The {@link Kia} instance used for displaying progress.
	 * @type {Kia}
	 */
	kia: Kia

	/**
	 * Creates an instance of the Scan class.
	 */
	constructor() {
		super()
		this.coreBlock = 0
		this.espaceBlock = 0n
		this.kia = new Kia('Waiting')
		this.kia.stopAndPersist()
	}

	/**
	 * Executes the scanning process for both Conflux Core and eSpace.
	 *
	 * @param {Object} [_options] - Optional parameters (not used).
	 * @returns {Promise<void>} Resolves when the scanning process starts.
	 *
	 * @example
	 * const scan = new Scan();
	 * await scan.execute();
	 * // Starts scanning and logging transactions from Conflux Core and eSpace.
	 */
	// deno-lint-ignore require-await
	async execute(_options: { address?: string }): Promise<void> {
		this.coreScan()
		this.espaceScan()
	}

	/**
	 * Converts a hexadecimal value to a decimal string.
	 *
	 * @param {bigint} hex - The hexadecimal value to convert.
	 * @returns {string} The decimal representation of the hexadecimal value.
	 *
	 * @example
	 * const scan = new Scan();
	 * console.log(scan.hexToDecimal(0x1a)); // '26'
	 */
	hexToDecimal(hex: bigint): string {
		return BigInt(hex).toString(10)
	}

	/**
	 * Formats a timestamp to a readable date and time string.
	 *
	 * @param {bigint | number} timestamp - The timestamp to format.
	 * @returns {string} The formatted date and time string.
	 *
	 * @example
	 * const scan = new Scan();
	 * console.log(scan.formatTimestamp(1654041600)); // '6/2/2022, 12:00:00 AM'
	 */
	formatTimestamp(timestamp: bigint | number): string {
		const date = new Date(Number(timestamp) * 1000)
		return date.toLocaleString()
	}

	/**
	 * Updates and displays the current block information in the Kia progress bar.
	 *
	 * @private
	 */
	kiaFrame() {
		this.kia.set(`Core: ${this.coreBlock} - eSpace: ${this.espaceBlock}`)
		this.kia.renderNextFrame()
	}

	/**
	 * Polls and processes new blocks from Conflux Core.
	 *
	 * @private
	 */
	coreScan() {
		const inter = setInterval(async () => {
			const block = await this.confluxClient.getBlockByEpochNumber(
				'latest_mined',
				true,
			)
			if (!block) {
				return
			}
			const timestamp = this.formatTimestamp(block.timestamp)
			this.coreBlock = block.blockNumber
			this.kiaFrame()
			const txs = block.transactions as unknown as ConfluxTransaction[]

			txs.forEach((tx) => {
				this.kia.info(
					`${bold(blue('Conflux Core Block:'))} ${block.blockNumber}`,
				)
				this.logTx(
					tx.hash,
					timestamp,
					tx.from,
					tx.to,
					this.formatEther(BigInt(tx.value)),
					this.hexToDecimal(BigInt(tx.gas)),
					this.hexToDecimal(BigInt(tx.gasPrice!)),
				)
			})
		}, this.config.dev_block_interval_ms)
		this.clear(inter)
	}

	/**
	 * Clears the polling interval (for testing purposes).
	 *
	 * @param {number} _interval - The interval ID to clear.
	 *
	 * @private
	 */
	// deno-lint-ignore no-explicit-any
	clear(_interval: any) {
		// clearInterval(interval)
	}

	/**
	 * Watches and processes new blocks and transactions from eSpace.
	 *
	 * @private
	 */
	espaceScan() {
		const _unwatch = this.viemClient.watchBlocks({
			emitMissed: false,
			includeTransactions: true,
			blockTag: 'latest',
			onError: (err) => console.log(err),
			onBlock: async (block) => {
				const blockDetails = await this.viemClient.getBlock({
					blockNumber: block.number,
				})
				const timestamp = this.formatTimestamp(blockDetails.timestamp)
				this.espaceBlock = block.number
				this.kiaFrame()
				block.transactions.forEach((tx) => {
					this.kia.info(
						`${bold(blue('eSpace Block:'))} ${block.number}`,
					)
					const to = `${tx.to}`
					this.logTx(
						tx.hash,
						timestamp,
						tx.from,
						to,
						this.formatEther(tx.value),
						this.hexToDecimal(tx.gas),
						this.hexToDecimal(tx.gasPrice!),
					)
				})
			},
		})
	}

	/**
	 * Logs transaction details to the console.
	 *
	 * @param {string} hash - The transaction hash.
	 * @param {string} timestamp - The formatted timestamp of the transaction.
	 * @param {string} from - The sender's address.
	 * @param {string} to - The recipient's address.
	 * @param {string} value - The value of the transaction.
	 * @param {string} gas - The gas used for the transaction.
	 * @param {string} gasPrice - The gas price of the transaction.
	 *
	 * @private
	 */
	logTx(
		hash: string,
		timestamp: string,
		from: string,
		to: string,
		value: string,
		gas: string,
		gasPrice: string,
	) {
		console.log(`${bold(green('Transaction hash:'))} ${hash}`)
		console.log(`${bold(yellow('Timestamp:'))} ${timestamp}`)
		console.log(`${bold(yellow('From:'))} ${from}`)
		console.log(`${bold(yellow('To:'))} ${to}`)
		console.log(`${bold(green('Value:'))} ${value} CFX`)
		console.log(`${bold(green('Gas Used:'))} ${gas}`)
		console.log(`${bold(green('Gas Price:'))} ${gasPrice} gwei`)
		console.log(`${bold(blue('\n~~\n'))}`)
	}
}
