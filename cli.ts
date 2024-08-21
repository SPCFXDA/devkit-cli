import { Command } from 'cliffy/command'
import Kia from 'kia'
import { ClientTask } from './src/task/mod.ts'
import { Balance, Faucet, Scan, Wallet } from './src/commands/mod.ts'
import denojson from './deno.json' with { type: 'json' }

export class DevkitCLI {
	private cfxNode: ClientTask
	private balance: Balance
	private faucet: Faucet
	private wallet: Wallet
	private program: Command

	constructor() {
		this.cfxNode = new ClientTask()
		this.balance = new Balance()
		this.faucet = new Faucet()
		this.wallet = new Wallet()

		this.program = new Command()
			.name('devkit-cli')
			.version(denojson.version)
			.description('CLI tool for Conflux development tasks.')
			.action(() => {
				this.program.showHelp()
			})

		this.initializeCommands()
	}

	private async handleKia(taskName: string, task: () => Promise<void>): Promise<void> {
		const kia = new Kia(`${taskName}...`)
		kia.start()
		try {
			await task()
			kia.stop()
			kia.succeed(`${taskName} completed!`)
		} catch (error) {
			kia.fail(`Failed: ${error.message}`)
			Deno.exit(1)
		}
	}

	private initializeCommands(): void {
		this.program
			.command('start')
			.description('Start the development node')
			.option('--logs [logs:boolean]', 'Display logs after starting', { default: false })
			.option('--scan [scan:boolean]', 'Scan the node for transactions after starting', { default: false })
			.action(async ({ logs, scan }) => {
				await this.handleKia('Starting the node', async () => {
					const boot = this.cfxNode.start()
					if (boot.code) {
						throw new Error(`Node already running PID(${boot.pid})`)
					}
					await this.cfxNode.status()
				})
				if (logs) {
					await this.cfxNode.logs()
				} else if (scan) {
					new Scan().run()
				} else {
					Deno.exit(0)
				}
			})

		this.program
			.command('stop')
			.description('Stop the development node')
			.action(async () => {
				await this.handleKia('Stopping the node', async () => {
					this.cfxNode.stop()
				})
			})

		this.program
			.command('scan')
			.description('Scan the node for transactions')
			.action(async () => {
				const scan = new Scan()
				await this.handleKia('Scanner start', async () => {
					await this.cfxNode.status()
					scan.run()
				})
			})

		this.program
			.command('status')
			.description('Show the node status')
			.action(async () => {
				let status
				await this.handleKia('Retrieving status', async () => {
					status = await this.cfxNode.status()
				})
				console.log(status)
			})

		this.program
			.command('logs')
			.description('Show node logs')
			.action(async () => {
				await this.handleKia('Retrieving logs', async () => {
					await this.cfxNode.logs()
				})
			})

		this.program
			.command('errors')
			.description('Show any errors the node produced')
			.action(async () => {
				let errors
				await this.handleKia('Retrieving errors', async () => {
					errors = await this.cfxNode.stderr()
				})
				console.log(errors)
			})

		this.program
			.command('balance [address:string]')
			.description('Show the balance of an address, or the genesis account if not specified')
			.action(async (options, address?: string) => {
				const addr = address || ''
				await this.balance.run({ address: addr })
			})

		this.program
			.command('faucet [amount:number] [address:string]')
			.description('Faucet utility to fund Core and eSpace wallets')
			.action(async (options, amount?: number, address?: string) => {
				await this.faucet.run({ value: amount, to: address })
			})

		const walletCommand = new Command()
			.name('wallet')
			.description('Configure a local HDWallet')
			.action(() => {
				walletCommand.showHelp()
			})

		const walletMnemonic = new Command()
			.name('mnemonic')
			.description('Manage mnemonic phrases')
			.action(() => {
				walletMnemonic.showHelp()
			})

		walletMnemonic
			.command('print')
			.description('Print the current mnemonic phrase')
			.action(async () => {
				await this.wallet.printMnemonic()
			})

		walletMnemonic
			.command('configure')
			.description('Configure the mnemonic phrase')
			.action(async () => {
				await this.wallet.configureMnemonic()
			})

		walletCommand.command('mnemonic', walletMnemonic)

		walletCommand
			.command('private-key')
			.description('Manage private keys')
			.option('--derivation-path [path:string]', 'Derivation path for the private key')
			.option('--espace [espace:boolean]', 'Use the eSpace network', { default: true })
			.option('--core [core:boolean]', 'Use the core network')
			.option('--index [index:number]', 'Index for key derivation', { default: 0 })
			.action(async ({ espace, core, index, derivationPath }) => {
				if (core) {
					await this.wallet.printCorePrivateKey(index as number)
				} else if (espace) {
					await this.wallet.printEspacePrivateKey(index as number)
				} else if (derivationPath) {
					await this.wallet.printPrivateKeyByDerivationPath(derivationPath as string)
				} else {
					console.log('Invalid options.')
				}
			})

		this.program.command('wallet', walletCommand)
	}

	public async parseArguments() {
		await this.program.parse(Deno.args)
	}
}

// Instantiate and parse arguments
const devkitCLI = new DevkitCLI()
await devkitCLI.parseArguments()
