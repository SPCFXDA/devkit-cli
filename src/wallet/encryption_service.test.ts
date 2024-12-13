import { snapshotTest } from 'cliffy/testing'
import { ansi } from 'cliffy/ansi'
import { EncryptionService } from './encryption_service.ts'

// import { assertEquals, assertRejects } from "@std/assert";

const mockGetRandomValues = (typedArray: Uint8Array) => {
	return typedArray
}

await snapshotTest({
	name: 'EncryptionService - encrypt and decrypt mnemonic successfully',
	meta: import.meta,
	stdin: ansi
		.text('password\n')
		.text('password\n')
		.toArray(),
	async fn() {
		const encryptionService = new EncryptionService()
		const mnemonic = 'test test test test test test test test test test test junk'
		encryptionService.getRandomValues = mockGetRandomValues
		const encryptedMnemonic = await encryptionService.encryptMnemonic(mnemonic)

		console.log('encrypted:', encryptedMnemonic)
		console.log('decrypted', await encryptionService.decryptMnemonic(encryptedMnemonic))
	},
})
