import { ClientTask } from '../task/mod.ts'

export class Wallet extends ClientTask {
	async execute(_options: { address?: string }) {
		// TODO
	}
}

export const wallet = new Wallet()
