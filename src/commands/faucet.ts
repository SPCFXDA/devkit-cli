import { ClientTask } from '../task/mod.ts'
import Kia from 'kia'
/**
 * Represents a task to execute transactions from a faucet.
 * Extends the {@link ClientTask} class to perform faucet operations, including balance checking and fund transfers.
 *
 * @extends ClientTask
 */
export class Faucet extends ClientTask {
	/**
	 * Executes the transaction from the faucet.
	 *
	 * @param {Object} options - Options for the faucet transaction.
	 * @param {string} options.value - The amount of CFX to send.
	 * @param {string} options.to - The destination address for the funds.
	 * @returns {Promise<void>} Resolves when the transaction execution is complete.
	 *
	 * @example
	 * const faucet = new Faucet();
	 * await faucet.execute({ value: '10', to: '0x123...' });
	 * // Sends 10 CFX to the specified address.
	 */
	async execute(options: { value: string; to: string }): Promise<void> {
		const kia = new Kia('Starting transaction execution...')
		kia.start()

		const requiredKeys = ['value', 'to']
		const missingKeys = requiredKeys.filter((key) => !(key in options))

		if (missingKeys.length > 0) {
			kia.fail(`Missing required options: ${missingKeys.join(', ')}`)
			Deno.exit(1)
		}

		try {
			kia.set('Validating connection to the node...')
			await this.status()
		} catch (error) {
			kia.fail('Connection validation failed: ' + this.formatError(error))
			Deno.exit(1)
		}

		const miner = this.confluxClient.wallet.addPrivateKey(this.readSecrets()[0])
		const balance: string = await this.getCoreBalance(miner.address)

		kia.succeed(`Faucet balance: ${balance} CFX`)
		kia.set('Processing transaction...')
		kia.start()

		if (!this.isNumeric(options.value)) {
			kia.fail('The specified amount is not a valid number.')
			Deno.exit(1)
		}

		const requestedAmount = parseFloat(options.value)
		if (requestedAmount <= 0) {
			kia.fail('The specified amount must be greater than zero.')
			Deno.exit(1)
		}

		if (requestedAmount > parseFloat(balance)) {
			kia.fail('Requested amount exceeds the available balance in the faucet.')
			Deno.exit(1)
		}

		try {
			if (this.isCoreAddress(options.to)) {
				await this.confluxClient.cfx.sendTransaction({
					from: miner.address,
					to: options.to,
					value: this.fromCfx(options.value),
				})
				kia.succeed(`Successfully sent ${options.value} CFX to Conflux address ${options.to}.`)
			} else if (this.isEspaceAddress(options.to)) {
				const receipt = await this.confluxClient.InternalContract('CrossSpaceCall')
					.transferEVM(options.to)
					.sendTransaction({
						from: miner.address,
						value: this.fromCfx(options.value),
					})
					.executed()

				if (receipt.outcomeStatus === 0) {
					kia.succeed(`Successfully transferred ${options.value} CFX to eSpace address ${options.to}.`)
				} else {
					kia.fail(`Transfer failed with outcome status ${receipt.outcomeStatus}.`)
				}
			} else {
				kia.fail('Invalid destination address provided.')
			}
		} catch (error) {
			kia.fail('Transaction failed: ' + this.formatError(error))
		} finally {
			kia.stop()
		}
	}

	/**
	 * Checks if the given value is a valid number.
	 *
	 * @param {string} value - The value to check.
	 * @returns {boolean} `true` if the value is a valid number; otherwise, `false`.
	 *
	 * @example
	 * const faucet = new Faucet();
	 * console.log(faucet.isNumeric('10')); // true
	 * console.log(faucet.isNumeric('abc')); // false
	 */
	isNumeric(value: string): boolean {
		return !isNaN(parseFloat(value)) && isFinite(parseFloat(value))
	}
}

/**
 * An instance of {@link Faucet} for executing faucet transactions.
 *
 * @type {Faucet}
 * @example
 * faucet.execute({ value: '10', to: '0x123...' });
 */
export const faucet = new Faucet()
