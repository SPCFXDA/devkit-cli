import { crypto } from '@std/crypto'
import { HDWallet } from '@conflux-dev/hdwallet'
import { Secret, Select } from 'cliffy/prompt'
import { ensureFileSync } from '@std/fs'
import { join } from '@std/path'
import { privateKeyToAccount } from 'viem/accounts'
import TreeGraph from 'js-conflux-sdk'
import { Address } from 'viem'

export class Wallet {
	private hdWallet: HDWallet | undefined
	private keystore: string
	private plaintextKeystore: string
	private storedMnemonic: string | Uint8Array | null
	private mnemonicSource: 'plaintext' | 'encrypted' | null
	constructor() {
		this.hdWallet = undefined
		this.keystore = join(Deno.env.get('HOME') || '', '.devkit.keystore')
		this.plaintextKeystore = join(Deno.env.get('HOME') || '', '.devkit.keystore.plaintext')
		this.storedMnemonic = null
		this.mnemonicSource = null
		ensureFileSync(this.keystore)
		ensureFileSync(this.plaintextKeystore)
	}

	// Read the keystore file
	private async readKeystore(): Promise<Uint8Array | null> {
		try {
			const data = await Deno.readFile(this.keystore)
			return new Uint8Array(data)
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) {
				return null
			}
			throw error
		}
	}

	// Read the plaintext keystore file
	private async readPlaintextKeystore(): Promise<string | null> {
		try {
			const data = await Deno.readTextFile(this.plaintextKeystore)
			return data
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) {
				return null
			}
			throw error
		}
	}

	// Write the encrypted mnemonic to the keystore file
	private async writeKeystore(data: Uint8Array): Promise<void> {
		await Deno.writeFile(this.keystore, data)
	}

	// Write the mnemonic to the plaintext keystore file
	private async writePlaintextKeystore(mnemonic: string): Promise<void> {
		await Deno.writeTextFile(this.plaintextKeystore, mnemonic)
	}

	// Derive the encryption key from a password
	private async deriveKeyFromPassword(reason: string): Promise<CryptoKey> {
		const password = await Secret.prompt({
			message: `${reason}`,
			writer: Deno.stderr,
		})
		const encoder = new TextEncoder()
		const passwordKey = await crypto.subtle.importKey(
			'raw',
			encoder.encode(password),
			'PBKDF2',
			false,
			['deriveKey'],
		)

		return await crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: encoder.encode('some-random-salt'),
				iterations: 100000,
				hash: 'SHA-256',
			},
			passwordKey,
			{ name: 'AES-GCM', length: 256 },
			true,
			['encrypt', 'decrypt'],
		)
	}

	// Encrypt the mnemonic
	private async encryptMnemonic(mnemonic: string): Promise<Uint8Array> {
		const iv = crypto.getRandomValues(new Uint8Array(12))
		const encodedMnemonic = new TextEncoder().encode(mnemonic)
		const key = await this.deriveKeyFromPassword(
			'Enter encryption password to secure your mnemonic on this system.',
		)
		const encrypted = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			key,
			encodedMnemonic,
		)
		return new Uint8Array([...iv, ...new Uint8Array(encrypted)])
	}

	// Decrypt the mnemonic
	private async decryptMnemonic(encryptedMnemonic: Uint8Array): Promise<string> {
		const key = await this.deriveKeyFromPassword(
			'Enter your decryption password to access the mnemonic.',
		)
		try {
			const iv = encryptedMnemonic.slice(0, 12)
			const data = encryptedMnemonic.slice(12)
			const decrypted = await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv },
				key,
				data,
			)
			console.error('Mnemonic successfully decrypted.')
			return new TextDecoder().decode(decrypted)
		} catch {
			throw new Error(
				'Decryption failed: incorrect password or corrupted data.',
			)
		}
	}

	async mnemonicCheck() {
		this.storedMnemonic = await this.readPlaintextKeystore()
		if (this.storedMnemonic !== '') {
			this.mnemonicSource = 'plaintext'
		} else {
			this.storedMnemonic = await this.readKeystore()
			if (this.storedMnemonic?.length) {
				this.mnemonicSource = 'encrypted'
			}
		}
		return this.mnemonicSource
	}

	// Configure the mnemonic
	async configureMnemonic() {
		await this.mnemonicCheck()
		if (!this.mnemonicSource) {
			await this.createOrImportMnemonic()
			return
		}

		const action = await Select.prompt({
			message: 'Mnemonic found. Do you want to delete, regenerate, or view it?',
			options: [
				{ name: 'Delete', value: 'd' },
				{ name: 'Regenerate', value: 'r' },
				{ name: 'View', value: 'v' },
			],
			writer: Deno.stderr,
		})

		if (action === 'd') {
			await this.deleteMnemonic()
		} else if (action === 'r') {
			await this.regenerateMnemonic()
		} else if (action === 'v') {
			if (this.mnemonicSource === 'plaintext') {
				console.log(this.storedMnemonic as string)
			} else {
				try {
					const mnemonic = await this.decryptMnemonic(this.storedMnemonic as Uint8Array)
					console.log(mnemonic)
				} catch (error) {
					console.error(error.message)
				}
			}
		}
	}

	// Create or import mnemonic
	private async createOrImportMnemonic(): Promise<string> {
		const storageChoice = await Select.prompt({
			message: 'Choose storage option for the mnemonic:',
			options: [
				{ name: 'Store encrypted', value: 'e' },
				{ name: 'Store in plaintext', value: 'p' },
			],
			writer: Deno.stderr,
		})

		const userChoice = await Select.prompt({
			message:
				'No mnemonic found. Would you like to generate a new one or insert an existing one? (Ctrl+C to abort)',
			options: [
				{ name: 'Generate a new mnemonic', value: 'g' },
				{ name: 'Insert an existing mnemonic', value: 'i' },
			],
			writer: Deno.stderr,
		})

		let mnemonic: string
		if (userChoice === 'i') {
			mnemonic = await Secret.prompt({
				message: 'Please enter your existing mnemonic. (Ctrl+C to abort if unsure)',
				writer: Deno.stderr,
			})
		} else {
			mnemonic = HDWallet.generateMnemonic()
			console.error(`Generated a new mnemonic.\n\n${mnemonic}\n\nBe sure to backup it and store it safely.`)
		}

		if (storageChoice === 'p') {
			await this.writePlaintextKeystore(mnemonic)
			console.error('Mnemonic has been stored in plaintext.')
		} else {
			const encryptedMnemonic = await this.encryptMnemonic(mnemonic)
			await this.writeKeystore(encryptedMnemonic)
			console.error('Mnemonic has been stored securely.')
		}

		return mnemonic
	}

	// Delete mnemonic
	private async deleteMnemonic(): Promise<void> {
		if (this.mnemonicSource === 'plaintext') {
			await Deno.remove(this.plaintextKeystore).catch(() => {})
		} else {
			await Deno.remove(this.keystore).catch(() => {})
		}
		console.error('Mnemonic deleted permanently.')
	}

	// Regenerate mnemonic
	private async regenerateMnemonic(): Promise<void> {
		const mnemonic = HDWallet.generateMnemonic()
		if (this.mnemonicSource === 'plaintext') {
			await this.writePlaintextKeystore(mnemonic)
			console.error('Mnemonic regenerated and stored in plaintext.')
		} else {
			const encryptedMnemonic = await this.encryptMnemonic(mnemonic)
			await this.writeKeystore(encryptedMnemonic)
			console.error('Mnemonic regenerated and securely stored.')
		}
		console.error(
			`Mnemonic regenerated and securely stored. Make sure to back it up in a secure way.\n\n${mnemonic} \n`,
		)
	}

	// Print mnemonic
	async printMnemonic(): Promise<void> {
		const storedPlaintextMnemonic = await this.readPlaintextKeystore()
		if (storedPlaintextMnemonic) {
			console.log(storedPlaintextMnemonic)
			return
		}

		const storedMnemonic = await this.readKeystore()

		if (storedMnemonic?.length) {
			try {
				const mnemonic = await this.decryptMnemonic(storedMnemonic)
				console.log(mnemonic)
			} catch (error) {
				console.error('Error retrieving mnemonic:', error.message)
			}
		} else {
			console.log(await this.createOrImportMnemonic())
		}
	}

	// Print private key by derivation path
	async privateKeyByDerivationPath(derivationPath: string): Promise<string | null> {
		let privateKey: string | null = null
		try {
			if (!this.hdWallet) {
				let mnemonic: string
				const storedPlaintextMnemonic = await this.readPlaintextKeystore()

				if (storedPlaintextMnemonic) {
					mnemonic = storedPlaintextMnemonic
				} else {
					const storedMnemonic = await this.readKeystore()
					if (!storedMnemonic) {
						mnemonic = await this.createOrImportMnemonic()
					} else {
						mnemonic = await this.decryptMnemonic(storedMnemonic)
					}
				}
				this.hdWallet = new HDWallet(mnemonic)
			}

			privateKey = `0x${this.hdWallet.getPrivateKey(derivationPath).toString('hex')}`
			// console.error('Private key displayed. (Handle with extreme caution.)')
		} catch (error) {
			console.error('Error fetching private key:', error.message)
		}
		return privateKey
	}

	// Print Espace private key
	async espacePrivateKey(index: number): Promise<string | null> {
		const derivationPath = `m/44'/60'/0'/0/${index}`
		return await this.privateKeyByDerivationPath(derivationPath)
	}

	// Print Core private key
	async corePrivateKey(index: number): Promise<string | null> {
		const derivationPath = `m/44'/503'/0'/0/${index}`
		return await this.privateKeyByDerivationPath(derivationPath)
	}

	async espaceAddress(index: number | null = null, privateKey: string | null = null): Promise<string | null> {
		if ((index === null && privateKey === null) || (index !== null && privateKey !== null)) {
			throw new Error("Invalid parameters: provide either 'index' or 'privateKey', but not both.")
		}

		if (index !== null) {
			privateKey = await this.espacePrivateKey(index)
		}

		return privateKeyToAccount(privateKey as Address).address
	}

	// Print Core private key
	async coreAddress(
		index: number | null = null,
		privateKey: string | null = null,
		rpcUrl: string = 'http://localhost:12537',
		networkId: number = 2029,
	): Promise<string | null> {
		if ((index === null && privateKey === null) || (index !== null && privateKey !== null)) {
			throw new Error("Invalid parameters: provide either 'index' or 'privateKey', but not both.")
		}
		const conflux = new TreeGraph.Conflux({
			url: rpcUrl,
			networkId: networkId,
		})

		if (index !== null) {
			privateKey = await this.corePrivateKey(index)
		}
		return conflux.wallet.addPrivateKey(privateKey).address
	}

	async corePrivateKeyBatch(from: number, to: number): Promise<string[]> {
		const privateKeys = []
		for (let index = from; index <= to; index++) {
			const pk = await this.corePrivateKey(index)
			if (pk) {
				privateKeys.push(pk)
			}
		}
		return privateKeys
	}

	async espacePrivateKeyBatch(from: number, to: number): Promise<string[]> {
		const privateKeys = []
		for (let index = from; index <= to; index++) {
			const pk = await this.espacePrivateKey(index)
			if (pk) {
				privateKeys.push(pk)
			}
		}
		return privateKeys
	}
}
