import { crypto } from '@std/crypto'
import { HDWallet } from '@conflux-dev/hdwallet'
import { Secret, Select } from 'cliffy/prompt'
import { ensureFileSync } from '@std/fs'
import { join } from '@std/path'
import { privateKeyToAccount } from 'viem/accounts'
import TreeGraph from 'js-conflux-sdk'
import { Address } from 'viem'

export class Wallet {
	private keystorePath: string
	private storedMnemonic: string | Uint8Array | null
	private mnemonicSource: 'plaintext' | 'encrypted' | null
	private hdWallet: HDWallet | undefined

	constructor() {
		this.keystorePath = join(Deno.env.get('HOME') || '', '.devkit.keystore.json')
		this.storedMnemonic = null
		this.mnemonicSource = null
		this.hdWallet = undefined
		ensureFileSync(this.keystorePath)
	}

	// Read the keystore file
	private async readKeystore(): Promise<{ type: string; keystore: string } | null> {
		try {
			const data = await Deno.readTextFile(this.keystorePath)
			return JSON.parse(data) as { type: string; keystore: string }
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) {
				return null
			}
			throw error
		}
	}

	// Write to the keystore file
	private async writeKeystore(type: 'plaintext' | 'encoded', keystore: string): Promise<void> {
		const data = JSON.stringify({ type, keystore }, null, 2)
		await Deno.writeTextFile(this.keystorePath, data)
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
	private async encryptMnemonic(mnemonic: string): Promise<string> {
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
		const encryptedData = new Uint8Array([...iv, ...new Uint8Array(encrypted)])
		return btoa(String.fromCharCode(...encryptedData)) // Base64 encode
	}

	// Decrypt the mnemonic
	private async decryptMnemonic(encryptedMnemonic: string): Promise<string> {
		const key = await this.deriveKeyFromPassword(
			'Enter your decryption password to access the mnemonic.',
		)
		try {
			const encryptedBytes = Uint8Array.from(atob(encryptedMnemonic), (c) => c.charCodeAt(0))
			const iv = encryptedBytes.slice(0, 12)
			const data = encryptedBytes.slice(12)
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

	// Check the mnemonic type and source
	async mnemonicCheck() {
		const keystore = await this.readKeystore()
		if (keystore) {
			this.storedMnemonic = keystore.keystore
			this.mnemonicSource = keystore.type === 'plaintext' ? 'plaintext' : 'encrypted'
		} else {
			this.storedMnemonic = null
			this.mnemonicSource = null
		}
		return this.mnemonicSource
	}

	// Create or import mnemonic
	async createOrImportMnemonic(): Promise<string> {
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
			console.error(
				`Generated a new mnemonic.\n\n${mnemonic}\n\nBe sure to backup it and store it safely.`,
			)
		}

		if (storageChoice === 'p') {
			await this.writeKeystore('plaintext', mnemonic)
			console.error('Mnemonic has been stored in plaintext.')
		} else {
			const encryptedMnemonic = await this.encryptMnemonic(mnemonic)
			await this.writeKeystore('encoded', encryptedMnemonic)
			console.error('Mnemonic has been stored securely.')
		}

		return mnemonic
	}

	// Print mnemonic
	async printMnemonic(): Promise<void> {
		const keystore = await this.readKeystore()
		if (!keystore) {
			console.log(await this.createOrImportMnemonic())
			return
		}

		if (keystore.type === 'plaintext') {
			console.log(keystore.keystore)
		} else {
			try {
				console.log(await this.decryptMnemonic(keystore.keystore))
			} catch (error) {
				if (error instanceof Error) {
					console.error('Error retrieving mnemonic:', error.message)
				} else {
					console.error('An unknown error occurred while retrieving mnemonic:', error)
				}
			}
		}
	}

	// Get private key by derivation path
	async privateKeyByDerivationPath(derivationPath: string): Promise<string | null> {
		if (!this.hdWallet) {
			const keystore = await this.readKeystore()
			if (!keystore) {
				throw new Error('No mnemonic found. Please configure your wallet.')
			}

			const mnemonic = keystore.type === 'plaintext'
				? keystore.keystore
				: await this.decryptMnemonic(keystore.keystore)

			this.hdWallet = new HDWallet(mnemonic)
		}

		return `0x${this.hdWallet.getPrivateKey(derivationPath).toString('hex')}`
	}

	// Get eSpace private key
	async espacePrivateKey(index: number): Promise<string | null> {
		const derivationPath = `m/44'/60'/0'/0/${index}`
		return await this.privateKeyByDerivationPath(derivationPath)
	}

	// Get Core private key
	async corePrivateKey(index: number): Promise<string | null> {
		const derivationPath = `m/44'/503'/0'/0/${index}`
		return await this.privateKeyByDerivationPath(derivationPath)
	}

	async espaceAddress(
		index: number | null = null,
		privateKey: string | null = null,
	): Promise<string | null> {
		if ((index === null && privateKey === null) || (index !== null && privateKey !== null)) {
			throw new Error("Invalid parameters: provide either 'index' or 'privateKey', but not both.")
		}

		if (index !== null) {
			privateKey = await this.espacePrivateKey(index)
		}

		if (!privateKey) {
			throw new Error('Failed to retrieve private key.')
		}

		return privateKeyToAccount(privateKey as Address).address
	}

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

		if (!privateKey) {
			throw new Error('Failed to retrieve private key.')
		}

		return conflux.wallet.addPrivateKey(privateKey).address
	}

	async corePrivateKeyBatch(from: number, to: number): Promise<string[]> {
		if (from > to) {
			throw new Error("'from' index must be less than or equal to 'to' index.")
		}

		const privateKeys: string[] = []
		for (let index = from; index <= to; index++) {
			const pk = await this.corePrivateKey(index)
			if (pk) {
				privateKeys.push(pk)
			}
		}
		return privateKeys
	}

	async espacePrivateKeyBatch(from: number, to: number): Promise<string[]> {
		if (from > to) {
			throw new Error("'from' index must be less than or equal to 'to' index.")
		}

		const privateKeys: string[] = []
		for (let index = from; index <= to; index++) {
			const pk = await this.espacePrivateKey(index)
			if (pk) {
				privateKeys.push(pk)
			}
		}
		return privateKeys
	}
}
