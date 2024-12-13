import { ensureFileSync } from '@std/fs'
import { join } from '@std/path'
import { KeystoreEntry, KeystoreFile } from '../types.ts'

export class KeystoreManager {
	private keystorePath: string
	private keystore: KeystoreEntry[] = []
	private activeIndex: number | null = 0

	constructor() {
		this.keystorePath = join(Deno.env.get('HOME') || '', '.devkit.keystore.json')
		ensureFileSync(this.keystorePath)
	}

	async readKeystore(): Promise<KeystoreFile | null> {
		try {
			const data = await Deno.readTextFile(this.keystorePath)
			return data.trim() ? JSON.parse(data) : null
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) return null
			throw error
		}
	}

	async writeKeystore(): Promise<void> {
		const data: KeystoreFile = { keystore: this.keystore, activeIndex: this.activeIndex }
		await Deno.writeTextFile(this.keystorePath, JSON.stringify(data, null, 2))
	}

	getKeystore() {
		return this.keystore
	}

	setKeystore(keystore: KeystoreEntry[]) {
		this.keystore = keystore
	}

	setActiveIndex(index: number | null) {
		this.activeIndex = index
	}

	getActiveIndex(): number {
		return this.activeIndex || 0
	}
}
