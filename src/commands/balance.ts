import { ClientTask } from '../task/mod.ts'
import Kia from 'kia'
/**
 * Represents a task to retrieve and display account balances.
 * Extends the {@link ClientTask} class to perform balance retrieval operations.
 *
 * @extends ClientTask
 */
export class Balance extends ClientTask {
	/**
	 * Executes the balance retrieval task.
	 *
	 * @param {Object} options - Options for the balance retrieval.
	 * @param {string} [options.address] - The address for which to retrieve the balance. If not provided, processes all genesis secrets.
	 * @returns {Promise<void>} Resolves when the balance retrieval task is complete.
	 *
	 * @example
	 * const balance = new Balance();
	 * await balance.execute({ address: '0x123...' });
	 * // Retrieves and logs the balance for the specified address.
	 *
	 * @example
	 * const balance = new Balance();
	 * await balance.execute({});
	 * // Retrieves and logs the balances for all genesis secrets.
	 */
	async execute(options: { address?: string }): Promise<void> {
		const kia = new Kia('Retrieving balance')
		kia.start()

		try {
			kia.set('Validating connection to the node...')
			await this.status()

			if (!options.address) {
				const secrets = this.readSecrets()
				for (let index = 0; index < secrets.length; index++) {
					const secret = secrets[index]
					if (secret.length > 0) {
						const wallet = this.confluxClient.wallet.addPrivateKey(secret)
						const balance = await this.getCoreBalance(wallet.address)
						kia.succeed(`Genesis address[${index}] Balance: ${balance} CFX`)
					}
				}
			} else {
				if (this.isCoreAddress(options.address)) {
					const balance = await this.getCoreBalance(options.address)
					kia.succeed(`Core address balance: ${balance} CFX`)
				} else if (this.isEspaceAddress(options.address)) {
					const balance = await this.getESpaceBalance(options.address)
					kia.succeed(`ESpace address balance: ${balance} CFX`)
				} else {
					kia.fail('Invalid address')
					return
				}
			}
		} catch (error) {
			kia.fail('Failed to retrieve balance: ' + this.formatError(error))
		} finally {
			kia.stop()
		}
	}
}

/**
 * An instance of {@link Balance} for executing balance retrieval tasks.
 *
 * @type {Balance}
 * @example
 * balance.execute({ address: '0x123...' });
 */
export const balance = new Balance()
