import yargs from 'yargs'
// import { Arguments} from 'yargs_types'
import { YargsInstance } from 'yarg_factory'
import Kia from 'kia'
import { ClientTask } from './src/task/mod.ts'
import { Balance, Faucet, Scan, Wallet } from './src/commands/mod.ts'

export class DevkitCLI {
	private cfxNode: ClientTask
	private balance: Balance
	private faucet: Faucet
	private wallet: Wallet
	private program: YargsInstance

	constructor() {
		const args = Deno.args.length ? Deno.args : ['help']
		this.cfxNode = new ClientTask()
		this.balance = new Balance()
		this.faucet = new Faucet()
		this.wallet = new Wallet()
		this.program = yargs(args)
			.scriptName('devkit-cli')
			.usage('$0 <cmd> [args]')
			.help()
			.alias('help', 'h')
			.version('0.2.0')
			.alias('version', 'v')
		this.initializeCommands()
	}

	private async handleKia(
		taskName: string,
		task: () => Promise<void>,
	): Promise<void> {
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

	private initializeCommands() {
		this.program.command(
			'start',
			'Start the development node',
			{
				logs: {
					type: 'boolean',
					describe: 'Display logs after starting',
					default: false,
				},
				scan: {
					type: 'boolean',
					describe: 'Scan the node for transactions after starting',
					default: false,
				},
			},
			async (argv: { logs: boolean; scan: boolean }) => {
				await this.handleKia('Starting the node', async () => {
					const boot = this.cfxNode.start()
					if (boot.code) {
						throw new Error(`Node already running PID(${boot.pid})`)
					}
					await this.cfxNode.status()
				})
				if (argv.logs) {
					await this.cfxNode.logs()
				} else if (argv.scan) {
					new Scan().run()
				} else {
					Deno.exit(0)
				}
			},
		)

		this.program.command(
			'stop',
			'Stop the development node',
			{},
			async () => {
				// deno-lint-ignore require-await
				await this.handleKia('Stopping the node', async () => {
					this.cfxNode.stop()
				})
			},
		)

		this.program.command(
			'scan',
			'Scan the node for transactions',
			{},
			async () => {
				const scan = new Scan()
				await this.handleKia('Scanner start', async () => {
					await this.cfxNode.status()
					scan.run()
				})
			},
		)

		this.program.command(
			'status',
			'Show the node status',
			{},
			async () => {
				let status
				await this.handleKia('Retrieving status', async () => {
					status = await this.cfxNode.status()
				})
				console.log(status)
			},
		)

		this.program.command(
			'logs',
			'Show node logs',
			{},
			async () => {
				await this.handleKia('Retrieving logs', async () => {
					await this.cfxNode.logs()
				})
			},
		)

		this.program.command(
			'errors',
			'Show any errors the node produced',
			{},
			async () => {
				let errors
				await this.handleKia('Retrieving errors', async () => {
					errors = await this.cfxNode.stderr()
				})
				console.log(errors)
			},
		)

		this.program.command(
			'balance [address]',
			"Show the balance of an address, if no address is specified show the genesis account's balance",
			{
				address: {
					type: 'string',
					describe: 'Wallet destination address',
				},
			},
			async (argv: { address?: string }) => {
				const address = argv.address || ''
				await this.balance.run({ address })
			},
		)

		this.program.command(
			'faucet [amount] [address]',
			'Faucet utility to fund Core and ESpace wallets',
			{
				amount: {
					type: 'number',
					describe: 'Amount of CFX to send',
				},
				address: {
					type: 'string',
					describe: 'Wallet destination address',
				},
			},
			async (argv: { amount?: number; address?: string }) => {
				await this.faucet.run({ value: argv.amount, to: argv.address })
			},
		)

		this.program.command(
			'wallet',
			'Configure a local HDWallet',
			{},
			async () => {
				await this.handleKia('Configuring wallet', async () => {
					await this.wallet.run()
				})
			},
		)

		this.program.command('*', '', () => {
			console.log('Command not found, use -h for help')
		})
	}

	public parseArguments() {
		this.program.parse()
	}
}

// Instantiate and parse arguments
const devkitCLI = new DevkitCLI()
devkitCLI.parseArguments()
