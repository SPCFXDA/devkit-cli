import { parse, stringify } from '@std/toml'
import * as yaml from '@std/yaml'
import TreeGraph from 'js-conflux-sdk'

import { BaseTask } from './base.ts'
import { NodeConfig } from '../types.ts'

import { dirname } from '@std/path'
import { crypto } from '@std/crypto'
import { ensureDirSync, existsSync } from '@std/fs'

import { ConfluxConfig, DevConfigGenerator, LogConfigGenerator, PosConfigGenerator } from '../config/mod.ts'

/**
 * Represents a setup task for initializing and managing the configuration
 * of a development environment, including configuration files, secrets, and
 * node settings.
 *
 * @extends BaseTask
 */
export class SetupTask extends BaseTask {
	/** List of secrets (private keys). */
	secrets: string[]
	env: ConfluxConfig
	/** Node configuration object. */
	config: NodeConfig

	/**
	 * Constructs a new instance of SetupTask and initializes paths and configuration.
	 */
	constructor() {
		super()
		this.env = new ConfluxConfig()
		this.secrets = []
		try {
			ensureDirSync(this.env.NODE_ROOT)
		} catch (error) {
			throw error
		}
		if (!existsSync(this.env.CONFIG_PATH)) {
			this.config = new DevConfigGenerator(this.env).generateConfig()
		} else {
			this.config = parse(
				Deno.readTextFileSync(this.env.CONFIG_PATH),
			) as unknown as NodeConfig
		}
	}

	/**
	 * Sets up the task by checking environment variables, generating configuration files,
	 * and creating secrets.
	 *
	 * @throws {Error} Throws an error if any of the setup steps fail.
	 */
	setup() {
		try {
			this.generateLogConfig()
			this.generatePosConfig()
			this.generateSecrets()
			this.writeConfig()
		} catch (error) {
			console.error(
				'An error occurred during initialization:',
				error.message,
			)
			// Deno.exit(1)
		}
	}

	/**
	 * Checks if the secrets file exists.
	 *
	 * @returns {boolean} true if the secrets file exists, false otherwise.
	 */
	secretExist(): boolean {
		return existsSync(this.config.genesis_secrets)
	}

	/**
	 * Writes the secrets to the secrets file.
	 * The secrets are formatted by removing the '0x' prefix and joining them with newline characters.
	 */
	writeSecrets() {
		const genesis: string[] = []
		this.secrets.forEach((privateKey: string) => {
			genesis.push(privateKey.replace('0x', ''))
		})
		Deno.writeTextFileSync(
			this.config.genesis_secrets,
			genesis.join('\n') + '\n',
		)
		// console.log('Secrets generated:' + this.secretsPath)
	}

	/**
	 * Writes the configuration to the configuration file.
	 *
	 * @param {NodeConfig} [config=this.config] - The configuration object to write. Defaults to the instance's config.
	 */
	writeConfig(config: NodeConfig = this.config) {
		Deno.writeTextFileSync(
			this.env.CONFIG_PATH,
			stringify(config as unknown as Record<string, unknown>),
		)
	}

	/**
	 * Generates secrets for the node. If secrets already exist, they are read from the secrets file.
	 * Otherwise, new secrets are generated and saved.
	 */
	generateSecrets() {
		if (this.secretExist()) {
			this.secrets = this.readSecrets()
			return
		}

		const hexString = Array.from(
			crypto.getRandomValues(new Uint8Array(32)),
			(byte) => byte.toString(16).padStart(2, '0'),
		).join('')

		const miningAccount = TreeGraph.PrivateKeyAccount.random(
			`0x${hexString}`,
			this.config.chain_id,
		)
		this.config.mining_author = miningAccount.address
		this.secrets.push(miningAccount.privateKey)
		this.writeSecrets()
	}

	/**
	 * Generates the POS (Proof of Stake) configuration if it does not already exist.
	 * This includes creating necessary directories and files, and executing a command to generate configuration.
	 */
	// deno-lint-ignore require-await
	async generatePosConfig() {
		const posRoot = dirname(this.config.pos_config_path)
		if (!existsSync(posRoot)) {
			Deno.mkdirSync(posRoot)
			const posConfig = new PosConfigGenerator(
				this.env,
				this.config.chain_id,
			).generateConfig()
			Deno.writeTextFileSync(
				this.config.pos_config_path,
				yaml.stringify(posConfig),
			)
		}
	}

	/**
	 * Generates the log configuration if it does not already exist.
	 * Creates the necessary directories and writes the log configuration to a YAML file.
	 */
	generateLogConfig() {
		if (!existsSync(this.config.log_conf)) {
			const logConfig = new LogConfigGenerator(this.env).generateConfig()
			const logPath = dirname(logConfig.appenders.logfile.path)
			if (!existsSync(logPath)) {
				Deno.mkdirSync(logPath)
			}
			Deno.writeTextFileSync(
				this.config.log_conf,
				yaml.stringify(logConfig),
			)
		}
	}

	/**
	 * Reads secrets from the secrets file, formats them by adding a '0x' prefix,
	 * and returns them as an array of strings.
	 *
	 * @returns {string[]} An array of formatted secrets (private keys).
	 */
	readSecrets(): string[] {
		return Deno.readTextFileSync(this.config.genesis_secrets)
			.split(/\r?\n/)
			.filter((element: string) => element !== '')
			.map((element: string) => `0x${element}`)
	}
}
