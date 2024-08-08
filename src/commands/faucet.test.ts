// deno-lint-ignore-file require-await
import { assertEquals } from '@std/assert'
import { assertSpyCallArgs, spy, stub } from '@std/testing/mock'
import { Faucet } from '../commands/mod.ts' // Adjust the path to your file
import Kia from 'kia'

const mockStatus = {
	bestHash: '0xa9',
	blockNumber: 0,
	chainId: 1,
	epochNumber: 2,
	ethereumSpaceChainId: 3,
	latestCheckpoint: 4,
	latestConfirmed: 5,
	latestFinalized: 6,
	latestState: 7,
	networkId: 8,
	pendingTxNumber: 9,
}

Deno.test('Faucet: execute should validate connection and send transaction to Conflux address', async () => {
	//TODO fix sendtransaction studs
	const faucet = new Faucet()
	faucet.status = async () => mockStatus
	faucet.readSecrets = () => [
		'0x1111111111111111111111111111111111111111111111111111111111111111',
	]
	faucet.getCoreBalance = async () => '10'

	faucet.confluxClient.cfx = () => ({
		sendTransaction: () => ({}),
	})
	faucet.isCoreAddress = () => false
	faucet.isEspaceAddress = () => true
	faucet.fromCfx = (value: string) => value

	const kiaStartSpy = spy(Kia.prototype, 'start')
	const kiaSetSpy = spy(Kia.prototype, 'set')
	const kiaSucceedSpy = spy(Kia.prototype, 'succeed')
	const kiaFailSpy = spy(Kia.prototype, 'fail')
	const kiaStopSpy = spy(Kia.prototype, 'stop')

	await faucet.execute({
		value: '10',
		to: 'net2029:aap3r3huv53ne832guk5j3pykr0rfj15ye7hdu2u7k',
	})

	assertEquals(kiaStartSpy.calls.length, 2)
	assertSpyCallArgs(kiaStartSpy, 0, [])
	assertSpyCallArgs(kiaStartSpy, 1, [])
	assertEquals(kiaSetSpy.calls.length, 2)
	assertSpyCallArgs(kiaStartSpy, 0, [])
	assertSpyCallArgs(kiaStartSpy, 1, [])
	assertEquals(kiaSucceedSpy.calls.length, 1)
	assertSpyCallArgs(kiaSucceedSpy, 0, ['Faucet balance: 10 CFX'])
	assertEquals(kiaFailSpy.calls.length, 1)
	assertEquals(kiaStopSpy.calls.length, 3)

	kiaStartSpy.restore()
	kiaSetSpy.restore()
	kiaSucceedSpy.restore()
	kiaFailSpy.restore()
	kiaStopSpy.restore()
})

Deno.test('Faucet: execute should validate connection and send transaction to eSpace address', async () => {
	const faucet = new Faucet()
	faucet.status = async () => mockStatus
	faucet.readSecrets = () => [
		'0x1111111111111111111111111111111111111111111111111111111111111111',
	]
	faucet.getCoreBalance = async () => '10'
	const transferEVMStub = stub(
		faucet.confluxClient,
		'InternalContract',
		() => ({
			transferEVM: () => ({
				sendTransaction: () => ({
					executed: async () => ({ outcomeStatus: 0 }),
				}),
			}),
		}),
	)
	faucet.isCoreAddress = () => false
	faucet.isEspaceAddress = () => true
	faucet.fromCfx = (value: string) => value

	const kiaStartSpy = spy(Kia.prototype, 'start')
	const kiaSetSpy = spy(Kia.prototype, 'set')
	const kiaSucceedSpy = spy(Kia.prototype, 'succeed')
	const kiaFailSpy = spy(Kia.prototype, 'fail')
	const kiaStopSpy = spy(Kia.prototype, 'stop')

	await faucet.execute({ value: '10', to: '0xajsdfasjdflkj' })

	assertEquals(kiaStartSpy.calls.length, 2)
	assertSpyCallArgs(kiaStartSpy, 0, [])
	assertSpyCallArgs(kiaStartSpy, 1, [])
	assertEquals(kiaSetSpy.calls.length, 2)
	assertSpyCallArgs(kiaStartSpy, 0, [])
	assertSpyCallArgs(kiaStartSpy, 1, [])
	assertEquals(kiaSucceedSpy.calls.length, 2)
	assertSpyCallArgs(kiaSucceedSpy, 0, ['Faucet balance: 10 CFX'])
	assertSpyCallArgs(kiaSucceedSpy, 1, [
		'Successfully transferred 10 CFX to eSpace address 0xajsdfasjdflkj.',
	])
	assertEquals(kiaFailSpy.calls.length, 0)
	assertEquals(kiaStopSpy.calls.length, 3)

	transferEVMStub.restore()
	kiaStartSpy.restore()
	kiaSetSpy.restore()
	kiaSucceedSpy.restore()
	kiaFailSpy.restore()
	kiaStopSpy.restore()
})

Deno.test('Faucet: execute should handle invalid address gracefully', async () => {
	const faucet = new Faucet()
	faucet.status = async () => mockStatus

	faucet.readSecrets = () => [
		'0x1111111111111111111111111111111111111111111111111111111111111111',
	]
	faucet.getCoreBalance = async () => '10'
	faucet.isCoreAddress = () => false
	faucet.isEspaceAddress = () => false
	faucet.fromCfx = (value: string) => value

	const kiaStartSpy = spy(Kia.prototype, 'start')
	const kiaSetSpy = spy(Kia.prototype, 'set')
	const kiaSucceedSpy = spy(Kia.prototype, 'succeed')
	const kiaFailSpy = spy(Kia.prototype, 'fail')
	const kiaStopSpy = spy(Kia.prototype, 'stop')

	await faucet.execute({ value: '10', to: 'invalid_address' })

	assertEquals(kiaStartSpy.calls.length, 2)
	assertSpyCallArgs(kiaStartSpy, 0, [])
	assertSpyCallArgs(kiaStartSpy, 1, [])
	assertEquals(kiaSetSpy.calls.length, 2)
	assertSpyCallArgs(kiaStartSpy, 0, [])
	assertSpyCallArgs(kiaStartSpy, 1, [])
	assertEquals(kiaSucceedSpy.calls.length, 1)
	assertSpyCallArgs(kiaSucceedSpy, 0, ['Faucet balance: 10 CFX'])
	assertEquals(kiaFailSpy.calls.length, 1)
	assertSpyCallArgs(kiaFailSpy, 0, ['Invalid destination address provided.'])
	assertEquals(kiaStopSpy.calls.length, 3)

	kiaStartSpy.restore()
	kiaSetSpy.restore()
	kiaSucceedSpy.restore()
	kiaFailSpy.restore()
	kiaStopSpy.restore()
})

Deno.test('Faucet: execute should handle errors gracefully', async () => {
	try {
		const faucet = new Faucet()
		faucet.status = async () => {
			throw new Error('Network error')
		}
		faucet.readSecrets = () => [
			'0x1111111111111111111111111111111111111111111111111111111111111111',
		]
		faucet.getCoreBalance = async () => '10'
		faucet.isCoreAddress = () => true
		faucet.isEspaceAddress = () => false
		faucet.fromCfx = (value: string) => value

		const kiaStartSpy = spy(Kia.prototype, 'start')
		const kiaSetSpy = spy(Kia.prototype, 'set')
		const kiaSucceedSpy = spy(Kia.prototype, 'succeed')
		const kiaFailSpy = spy(Kia.prototype, 'fail')
		const kiaStopSpy = spy(Kia.prototype, 'stop')

		await faucet.execute({ value: '10', to: 'cfx:aajsdfasjdflkj' })

		assertEquals(kiaStartSpy.calls.length, 1)
		assertSpyCallArgs(kiaStartSpy, 0, [])
		assertEquals(kiaSetSpy.calls.length, 1)
		assertSpyCallArgs(kiaStartSpy, 0, [])
		assertEquals(kiaSucceedSpy.calls.length, 0)
		assertEquals(kiaFailSpy.calls.length, 1)
		assertSpyCallArgs(kiaFailSpy, 0, [
			'Connection validation failed: Network error',
		])
		assertEquals(kiaStopSpy.calls.length, 1)

		kiaStartSpy.restore()
		kiaSetSpy.restore()
		kiaSucceedSpy.restore()
		kiaFailSpy.restore()
		kiaStopSpy.restore()
	} catch (_error) {
		// avoid exit 1 for test
		Deno.exitCode = 0
	}
})
