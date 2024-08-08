import { join } from '@std/path'
import * as yaml from '@std/yaml'
import { existsSync } from '@std/fs'

import { SetupTask } from './setup.ts'
import { LogConfigType } from '../types.ts'

/**
 * Represents a task for managing and controlling the Conflux node process,
 * including starting, stopping, and accessing logs.
 *
 * @extends SetupTask
 */
export class NodeTask extends SetupTask {
	/** Decoder used to decode process output. */
	private td: TextDecoder

	/**
	 * Constructs a new instance of NodeTask and initializes the TextDecoder.
	 */
	constructor() {
		super()
		this.td = new TextDecoder()
	}

	/**
	 * Starts the Conflux node process. If the process is already running,
	 * returns the process ID and a non-zero code. Otherwise, starts a new
	 * process and returns the process ID with a zero code.
	 *
	 * @returns {{ code: number; pid: string | null }} An object containing the exit code and process ID.
	 */
	start(): { code: number; pid: string | null } {
		this.setup()
		const pid = this.getPid()
		if (pid) {
			return { code: 1, pid }
		}

		const command = new Deno.Command('conflux', {
			args: [`--config=${this.env.CONFIG_PATH}`],
			cwd: this.env.NODE_ROOT,
			env: { RUST_BACKTRACE: '1' },
			stdin: 'null',
			stdout: 'null',
			stderr: 'piped',
		})

		const child = command.spawn()

		child.stderr.pipeTo(
			Deno.openSync(join(this.env.LOG, 'stderr.txt'), {
				write: true,
				create: true,
			}).writable,
		)

		child.unref()
		return { code: 0, pid: pid }
	}

	/**
	 * Stops the Conflux node process. Throws an error if the process is not found.
	 *
	 * @throws {Error} Throws an error if the node process is not found.
	 */
	stop(): void {
		const pid = this.getPid()
		if (!pid) {
			throw new Error('Node process not found')
		}
		Deno.kill(Number(pid))
	}

	/**
	 * Retrieves the process ID of the Conflux node process.
	 *
	 * @returns {string | null} The process ID of the node process, or null if not found.
	 */
	getPid(): string | null {
		const command = new Deno.Command('pidof', {
			args: ['conflux'],
		})

		const { stdout } = command.outputSync()
		return this.td.decode(stdout).trim() || null
	}

	/**
	 * Reads and displays the log file specified in the configuration.
	 * Listens for SIGINT signal to stop reading the log file.
	 *
	 * @throws {Error} Throws an error if the log configuration or log file is not found.
	 */
	async logs(): Promise<void> {
		const logConfPath = this.config.log_conf
		if (existsSync(logConfPath)) {
			const logConfigString = await Deno.readTextFile(logConfPath)
			const logConfig = yaml.parse(logConfigString) as LogConfigType

			if (existsSync(logConfig.appenders.logfile.path)) {
				const abortController = new AbortController()
				const { signal } = abortController

				this.tailF(logConfig.appenders.logfile.path, signal)
			} else {
				throw new Error('Log file specified in configuration not found')
			}
		} else {
			throw new Error('Log configuration file not found')
		}
	}

	/**
	 * Reads and returns the content of the standard error file.
	 *
	 * @returns {string} The content of the stderr file, or a message if it is empty.
	 * @throws {Error} Throws an error if there is an issue reading the stderr file.
	 */
	stderr(): string {
		try {
			const data = Deno.readTextFileSync(
				join(this.env.LOG, 'stderr.txt'),
			)
			if (data.trim().length === 0) {
				return 'No content to display from stderr.'
			}
			return data
		} catch (error) {
			throw new Error(`Error reading stderr file: ${error.message}`)
		}
	}

	/**
	 * Continuously reads from a file and logs the content to the console as the file is modified.
	 * @param {string} filePath - The path to the file to be tailed.
	 */
	async tailF(filePath: string, abortSignal: AbortSignal) {
		const file = await Deno.open(filePath, { read: true })
		const decoder = new TextDecoder()
		let fileSize = (await file.stat()).size

		// Initialize the position to read from the end of the file
		await file.seek(fileSize, Deno.SeekMode.Start)

		const watcher = Deno.watchFs(filePath)

		try {
			for await (const event of watcher) {
				if (abortSignal.aborted) {
					break
				}
				for (const _path of event.paths) {
					if (event.kind === 'modify') {
						const newFileSize = (await Deno.stat(filePath)).size
						const diffSize = newFileSize - fileSize

						if (diffSize > 0) {
							const buffer = new Uint8Array(diffSize)
							await file.read(buffer)

							// Decode the new content and split by lines
							const newContent = decoder.decode(buffer)
							const lines = newContent.split('\n')

							// Print each new line
							for (const line of lines) {
								if (line.length > 0) {
									console.log(line)
								}
							}

							fileSize = newFileSize
						}
					}
				}
			}
		} finally {
			file.close()
			//   watcher.close();
		}
	}
}
