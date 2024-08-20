import { crypto } from '@std/crypto'
import { HDWallet } from '@conflux-dev/hdwallet'
import { Secret, Select } from 'cliffy/prompt'
import { ensureFileSync } from '@std/fs'
import { join } from '@std/path'

export class Wallet {
	private hdWallet: HDWallet | undefined
	private keystore: string

	constructor() {
		this.hdWallet = undefined
		this.keystore = join(Deno.env.get("HOME") || "", ".devkit.keystore")
		ensureFileSync(this.keystore)

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

	// Write the encrypted mnemonic to the keystore file
	private async writeKeystore(data: Uint8Array): Promise<void> {
		await Deno.writeFile(this.keystore, data)
	}

	// Derive the encryption key from a password
	private async deriveKeyFromPassword(reason: string): Promise<CryptoKey> {
		const password = await Secret.prompt({ message: reason })
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
		const key = await this.deriveKeyFromPassword('Enter encryption password:')
		const encrypted = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			key,
			encodedMnemonic,
		)
		return new Uint8Array([...iv, ...new Uint8Array(encrypted)])
	}

	// Decrypt the mnemonic
	private async decryptMnemonic(encryptedMnemonic: Uint8Array): Promise<string> {
		const key = await this.deriveKeyFromPassword('Enter decryption password:')
		try {
			const iv = encryptedMnemonic.slice(0, 12)
			const data = encryptedMnemonic.slice(12)
			const decrypted = await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv },
				key,
				data,
			)
			return new TextDecoder().decode(decrypted)
		} catch {
			throw new Error('Decryption failed: incorrect password or corrupted data.')
		}
	}

	// Configure the mnemonic
	async configureMnemonic() {
		const storedMnemonic = await this.readKeystore()
		if (!storedMnemonic?.length) {
			await this.createOrImportMnemonic()
		} else {
			const action = await Select.prompt({
				message: 'Mnemonic found. Do you want to delete, regenerate, or view it?',
				options: [
					{ name: 'Delete', value: 'd' },
					{ name: 'Regenerate', value: 'r' },
					{ name: 'View', value: 'v' },
				],
			})

			if (action === 'd') {
				await this.deleteMnemonic()
			} else if (action === 'r') {
				await this.regenerateMnemonic()
			} else if (action === 'v') {
				try {
					const mnemonic = await this.decryptMnemonic(storedMnemonic!)
					console.error(mnemonic)
				} catch (error) {
					console.error(error.message)
				}
			}
		}
	}

	// Create or import mnemonic
	private async createOrImportMnemonic(): Promise<string> {
		const userChoice = await Select.prompt({
			message: 'No mnemonic found. Do you want to generate or insert a mnemonic?',
			options: [
				{ name: 'Generate', value: 'g' },
				{ name: 'Insert', value: 'i' },
			],
		})

		let mnemonic: string
		if (userChoice === 'i') {
			mnemonic = await Secret.prompt({ message: 'Please enter your mnemonic:' })
		} else {
			mnemonic = HDWallet.generateMnemonic()
			console.log('Generated mnemonic:', mnemonic)
		}

		const encryptedMnemonic = await this.encryptMnemonic(mnemonic)
		await this.writeKeystore(encryptedMnemonic)
		console.log('Mnemonic stored securely.')
		return mnemonic
	}

	// Delete mnemonic
	private async deleteMnemonic(): Promise<void> {
		await Deno.remove(this.keystore)
		console.log('Mnemonic deleted.')
	}

	// Regenerate mnemonic
	private async regenerateMnemonic(): Promise<void> {
		const mnemonic = HDWallet.generateMnemonic()
		const encryptedMnemonic = await this.encryptMnemonic(mnemonic)
		await this.writeKeystore(encryptedMnemonic)
		console.log('Mnemonic regenerated and stored securely.', mnemonic)
	}

	// Print mnemonic
	async printMnemonic(): Promise<void> {
		const storedMnemonic = await this.readKeystore()

		if (storedMnemonic?.length) {
			try {
				const mnemonic = await this.decryptMnemonic(storedMnemonic)
				console.error(mnemonic)
			} catch (error) {
				console.log('Error retrieving mnemonic:', error.message)
			}
		} else {
			console.error(await this.createOrImportMnemonic())
		}
	}

	// Print private key by derivation path
	async printPrivateKeyByDerivationPath(derivationPath: string): Promise<void> {
		try {
			if (!this.hdWallet) {
				const storedMnemonic = await this.readKeystore()
				if (!storedMnemonic) {
					this.hdWallet = new HDWallet(await this.createOrImportMnemonic())
				} else {
					this.hdWallet = new HDWallet(await this.decryptMnemonic(storedMnemonic))
				}
			}

			const privateKey = `0x${this.hdWallet.getPrivateKey(derivationPath).toString('hex')}`
			console.log('Private Key:', privateKey)
		} catch (error) {
			console.log(error.message)
		}
	}

	// Print Espace private key
	async printEspacePrivateKey(index: number): Promise<void> {
		const derivationPath = `m/44'/60'/0'/0/${index}`
		await this.printPrivateKeyByDerivationPath(derivationPath)
	}

	// Print Core private key
	async printCorePrivateKey(index: number): Promise<void> {
		const derivationPath = `m/44'/503'/0'/0/${index}`
		await this.printPrivateKeyByDerivationPath(derivationPath)
	}
}
