import { Command } from 'cliffy/command'
import { ClientTask } from './src/task/mod.ts'
import { Balance, Faucet, Scan, Wallet } from './src/commands/mod.ts'
import denojson from './deno.json' with { type: 'json' }
import { privateKeyToAccount } from 'viem/accounts'
import { delay } from '@std/async/delay'
import { CliSpinner } from './src/spinner.ts'

export class DevkitCLI {
	private cfxNode: ClientTask
	private balance: Balance
	private faucet: Faucet
	private wallet: Wallet
	private program: Command
	private cs: CliSpinner

	constructor() {
		this.cfxNode = new ClientTask()
		this.balance = new Balance()
		this.faucet = new Faucet()
		this.wallet = new Wallet()
		this.cs = new CliSpinner()
		this.program = new Command()
			.name('devkit-cli')
			.version(denojson.version)
			.description('CLI tool for Conflux development tasks.')
			.action(() => {
				this.program.showHelp()
			})

		this.initializeCommands()
	}

	// private async handleKia(taskName: string, task: () => Promise<void>): Promise<void> {
	// 	const kia = new Kia(`${taskName}...`)
	// 	kia.start()
	// 	try {
	// 		await task()
	// 		kia.stop()
	// 		kia.succeed(`${taskName} completed!`)
	// 	} catch (error) {
	// 		kia.fail(`Failed: ${error.message}`)
	// 		Deno.exit(1)
	// 	}
	// }

	async isDirectoryEmpty(path: string): Promise<boolean> {
		for await (const _ of Deno.readDir(path)) {
			// If we enter the loop, the directory has at least one item.
			return false
		}
		// If we never enter the loop, the directory is empty.
		return true
	}

	private initializeCommands(): void {
		this.program
			.command('start')
			.description('Start the development node')
			.option('--logs [logs:boolean]', 'Display logs after starting', { default: false })
			.option('--scan [scan:boolean]', 'Scan the node for transactions after starting', { default: false })
			.action(async ({ logs, scan }) => {
				try {
					let init = false
					this.cs.start('Validating configuration')
					if (await this.isDirectoryEmpty(this.cfxNode.env.NODE_ROOT) && await this.wallet.mnemonicCheck()) {
						this.cs.stop()
						console.log('Found mnemonic during initialization, deriving genesis private keys from mnemonic')
						this.cfxNode.secrets = await this.wallet.corePrivateKeyBatch(0, 9)
						init = true
						this.cs.start()
					}
					this.cs.set('Starting the node..')
					this.cfxNode.setup()
					const boot = this.cfxNode.start()
					if (boot.code) {
						throw new Error(`Node already running PID(${boot.pid})`)
					}
					this.cs.set('Node bootstrap...')
					await this.cfxNode.status()
					if (init) {
						const espacePks = await this.wallet.espacePrivateKeyBatch(0, 9)
						this.cs.set('Initializing CrossSpaceCall...')
						//NOTE: node in catchup mode
						//find a verification of node fully operational status instead of the delay
						await delay(8000)
						for (let index = 0; index < espacePks.length; index++) {
							const coreAccount = await this.cfxNode.confluxClient.wallet.addPrivateKey(
								this.cfxNode.secrets[index],
							)
							const espaceAddress = await this.wallet.espaceAddress(null, espacePks[index])
							this.cs.set(`initializing account ${index + 1}/${espacePks.length}`)
							const _receipt = await this.cfxNode.confluxClient.InternalContract('CrossSpaceCall')
								.transferEVM(espaceAddress)
								.sendTransaction({
									from: coreAccount.address,
									value: this.cfxNode.fromCfx(5000),
								})
								.executed()
						}
					}
				} catch (error) {
					this.cs.fail(error)
					Deno.exit(1)
				}
				this.cs.succeed('Node started successfully!')

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
				this.cs.start('Stopping the node')
				try {
					this.cfxNode.stop()
					this.cs.succeed('Node stopped!')
				} catch (error) {
					this.cs.fail(error)
				}
				this.cs.stop()
			})

		this.program
			.command('scan')
			.description('Scan the node for transactions')
			.action(async () => {
				const scan = new Scan()
				try {
					this.cs.start('Scanner start')
					await this.cfxNode.status()
					this.cs.stop()
					scan.run()
				} catch (error) {
					this.cs.fail(error)
				}
			})

		this.program
			.command('status')
			.description('Show the node status')
			.action(async () => {
				try {
					this.cs.start('Retriving node status...')
					const status = await this.cfxNode.status()
					this.cs.stop()
					console.log(status)
				} catch (error) {
					this.cs.fail(error)
				}
			})

		this.program
			.command('logs')
			.description('Show node logs')
			.action(async () => {
				await this.cfxNode.logs()
			})

		this.program
			.command('errors')
			.description('Show any errors the node produced')
			.action(async () => {
				console.log(this.cfxNode.stderr())
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
					console.log(await this.wallet.corePrivateKey(index as number))
				} else if (espace) {
					console.log(await this.wallet.espacePrivateKey(index as number))
				} else if (derivationPath) {
					console.log(await this.wallet.privateKeyByDerivationPath(derivationPath as string))
				} else {
					console.log('Invalid options.')
				}
			})

		walletCommand
			.command('address')
			.description('Derive address from mnemonic')
			.option('--espace [espace:boolean]', 'Use the eSpace network', { default: true })
			.option('--core [core:boolean]', 'Use the core network')
			.option('--index [index:number]', 'Index for key derivation', { default: 0 })
			.action(async ({ espace, core, index }) => {
				if (core) {
					console.log(await this.wallet.coreAddress(index as number))
				} else if (espace) {
					console.log(await this.wallet.espaceAddress(index as number))
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
