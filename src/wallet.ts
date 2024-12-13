import { Input, Secret, Select } from 'cliffy/prompt'
import { english, generateMnemonic, generatePrivateKey } from 'cive/accounts'

import { crypto } from '@std/crypto'
import { ensureFileSync } from '@std/fs'
import { join } from '@std/path'
import { HDWallet } from '@conflux-dev/hdwallet'

// --- Types ---
type KeystoreEntry = {
	type: 'plaintext' | 'encoded'
	label: string
	mnemonic: string
}

type KeystoreFile = {
	keystore: KeystoreEntry[]
	activeIndex: number | null
}

export class Wallet {
	// Properties
	private keystorePath: string
	private keystore: KeystoreEntry[] = []
	private activeIndex: number | null = 0
	private hdWallet?: HDWallet

	constructor() {
		this.keystorePath = join(Deno.env.get('HOME') || '', '.devkit.keystore.json')
		ensureFileSync(this.keystorePath)
	}

	// --- Keystore Management ---
	private async readKeystore(): Promise<KeystoreFile | null> {
		try {
			const data = await Deno.readTextFile(this.keystorePath)
			return data.trim() ? JSON.parse(data) : null
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) return null
			throw error
		}
	}

	private async writeKeystore(): Promise<void> {
		const data: KeystoreFile = { keystore: this.keystore, activeIndex: this.activeIndex }
		await Deno.writeTextFile(this.keystorePath, JSON.stringify(data, null, 2))
	}

	async initializeKeystore(): Promise<void> {
		const existingKeystore = await this.readKeystore()
		if (!existingKeystore) {
			console.log('No keystore found. Creating a default keystore...')
			this.keystore.push({
				type: 'plaintext',
				label: 'Default Keystore',
				mnemonic: 'test test test test test test test test test test test junk',
			})
			this.activeIndex = 0
			await this.writeKeystore()
			console.log('Default keystore created and activated.')
		} else {
			this.keystore = existingKeystore.keystore
			this.activeIndex = existingKeystore.activeIndex
			this.hdWallet = new HDWallet(await this.getActiveMnemonic())
		}
	}

	// --- Mnemonic Management ---
	async addMnemonic(): Promise<void> {
		const storageChoice = await Select.prompt({
			message: 'Choose storage option for the mnemonic:',
			options: [
				{ name: 'Store encrypted', value: 'e' },
				{ name: 'Store in plaintext', value: 'p' },
			],
		})

		const mnemonic = await this.promptForMnemonic()

		const defaultLabel = `Mnemonic ${this.keystore.length + 1}`
		const label = await Input.prompt({
			message: 'Enter a label for this mnemonic:',
			default: defaultLabel,
		})

		if (storageChoice === 'p') {
			this.keystore.push({ type: 'plaintext', label, mnemonic })
		} else {
			const encryptedMnemonic = await this.encryptMnemonic(mnemonic)
			this.keystore.push({ type: 'encoded', label, mnemonic: encryptedMnemonic })
		}

		await this.writeKeystore()
		console.error(storageChoice === 'p' ? 'Mnemonic stored in plaintext.' : 'Mnemonic stored securely.')
	}

	private async promptForMnemonic(): Promise<string> {
		const userChoice = await Select.prompt({
			message: 'Generate or import a mnemonic?',
			options: [
				{ name: 'Generate a new mnemonic', value: 'g' },
				{ name: 'Insert an existing mnemonic', value: 'i' },
			],
		})
		return userChoice === 'i' ? await this.importMnemonic() : generateMnemonic(english)
	}

	private async importMnemonic(): Promise<string> {
		console.log('\nPlease enter your mnemonic key one word at a time.')
		const words: string[] = []
		for (let i = 1; i <= 12; i++) {
			const word = await Input.prompt({
				message: `Enter word ${i} of 12`,
				suggestions: english,
				validate: (input) =>
					english.includes(input) || 'Invalid word. Please enter a valid BIP-39 mnemonic word.',
			})
			words.push(word)
		}
		return words.join(' ')
	}

	// --- Encryption/Decryption ---
	private async deriveKeyFromPassword(reason: string, salt: Uint8Array): Promise<CryptoKey> {
		const password = await Secret.prompt({ message: reason })
		const encoder = new TextEncoder()
		const passwordKey = await crypto.subtle.importKey(
			'raw',
			encoder.encode(password),
			'PBKDF2',
			false,
			['deriveKey'],
		)

		return crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt,
				iterations: 100_000,
				hash: 'SHA-256',
			},
			passwordKey,
			{ name: 'AES-GCM', length: 256 },
			true,
			['encrypt', 'decrypt'],
		)
	}

	private async encryptMnemonic(mnemonic: string): Promise<string> {
		const iv = crypto.getRandomValues(new Uint8Array(12))
		const salt = crypto.getRandomValues(new Uint8Array(16))
		const key = await this.deriveKeyFromPassword('Enter encryption password to secure your mnemonic.', salt)
		const encrypted = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			key,
			new TextEncoder().encode(mnemonic),
		)
		const encryptedData = new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)])
		return btoa(String.fromCharCode(...encryptedData))
	}

	private async decryptMnemonic(encryptedMnemonic: string): Promise<string> {
		const encryptedBytes = Uint8Array.from(atob(encryptedMnemonic), (c) => c.charCodeAt(0))
		const salt = encryptedBytes.slice(0, 16)
		const iv = encryptedBytes.slice(16, 28)
		const data = encryptedBytes.slice(28)

		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				const key = await this.deriveKeyFromPassword('Password: ', salt)
				const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
				return new TextDecoder().decode(decrypted)
			} catch {
				console.error(`Decryption failed (${attempt}/3). Incorrect password or corrupted data.`)
			}
		}
		throw new Error('Maximum decryption attempts reached.')
	}

	// --- Wallet Management ---
	async selectActiveMnemonic(): Promise<void> {
		if (this.keystore.length === 0) {
			console.log('No mnemonics found.')
			return
		}

		const selectedIndex = await Select.prompt({
			message: 'Select the active mnemonic:',
			options: this.keystore.map((mnemonicObj, index) => ({
				name: mnemonicObj.label,
				value: String(index),
			})),
		})

		this.activeIndex = Number(selectedIndex)
		await this.writeKeystore()
		console.log(`Active wallet set to: ${this.keystore[this.activeIndex]?.label}`)
		this.hdWallet = new HDWallet(await this.getActiveMnemonic())
	}

	async getActiveMnemonic(): Promise<string> {
		if (this.activeIndex === null || this.activeIndex < 0 || this.activeIndex >= this.keystore.length) {
			throw new Error('No active mnemonic selected.')
		}
		let mnemonic: string
		if (this.hdWallet) {
			mnemonic = this.hdWallet?.mnemonic
		} else {
			const mnemonicObj = this.keystore[this.activeIndex]
			mnemonic = mnemonicObj.type === 'encoded'
				? await this.decryptMnemonic(mnemonicObj.mnemonic)
				: mnemonicObj.mnemonic
		}
		return mnemonic
	}

	getActiveMnemonicLabel(): string {
		return this.activeIndex !== null && this.keystore[this.activeIndex]
			? this.keystore[this.activeIndex].label
			: 'None'
	}

	privateKeyByDerivationPath(derivationPath: string): string {
		return `0x${this.hdWallet!.getPrivateKey(derivationPath).toString('hex')}`
	}

	espacePrivateKey(index: number): string {
		return this.privateKeyByDerivationPath(`m/44'/60'/0'/0/${index}`)
	}

	corePrivateKey(index: number): string {
		return this.privateKeyByDerivationPath(`m/44'/503'/0'/0/${index}`)
	}

	generatePrivateKey(): `0x${string}` {
		return generatePrivateKey()
	}
}
