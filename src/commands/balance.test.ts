// deno-lint-ignore-file require-await
import { assertEquals } from '@std/assert'
import { assertSpyCallArgs, spy } from '@std/testing/mock'
import { Balance } from '../commands/mod.ts' // Adjust the path to your file
import { ConfluxConfig } from '../config/mod.ts'
import Kia from 'kia'

const root_path = '/tmp/balance.ts'

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
function removeArtifacts() {
	try {
		Deno.removeSync(root_path, { recursive: true })
	} catch {
		// Do nothing if doesn't exist
	}
}

function mockEnvClean() {
	removeArtifacts()
	Object.keys(new ConfluxConfig()).forEach((property) => {
		Deno.env.delete(property)
	})
}

function mockEnvSet() {
	removeArtifacts()
	Deno.env.set('CONFLUX_NODE_ROOT', root_path)
	Deno.env.set('CONFLUX_CONFIG_PATH', root_path + '/develop.toml')
	Deno.env.set('CONFLUX_LOG', root_path + '/log')
	Deno.env.set('CONFLUX_LOG_FILE', root_path + '/log/conflux.log')
	Deno.env.set(
		'CONFLUX_LOG_ARCHIVE',
		root_path + '/log/archive/conflux.{}.gz',
	)
	Deno.env.set('CONFLUX_LOG_CONFIG', root_path + '/log/config.yaml')
	Deno.env.set('CONFLUX_SECRETS_PATH', root_path + '/secrets.txt')
	Deno.env.set('CONFLUX_NODE_DATA', root_path + '/node/data')
	Deno.env.set('CONFLUX_POS_ROOT', root_path + '/pos/')
	Deno.env.set('CONFLUX_POS_DATA', root_path + '/pos/data')
	Deno.env.set('CONFLUX_POS_GENESIS', root_path + '/pos/genesis')
	Deno.env.set('CONFLUX_POS_LOG', root_path + '/pos/log')
	Deno.env.set('CONFLUX_POS_CONFIG', root_path + '/pos/config')
	Deno.env.set('CONFLUX_POS_NODES', root_path + '/pos/nodes')
	Deno.env.set('CONFLUX_POS_KEY', root_path + '/pos/key')
	Deno.env.set('CONFLUX_POS_KEY_PWD', 'ABCD123')
	Deno.env.set('CONFLUX_CHAIN_ID', '1234')
	Deno.env.set('CONFLUX_EVM_CHAIN_ID', '5678')
}

Deno.test('Balance: execute should validate connection and retrieve balances for genesis secrets', async () => {
	mockEnvSet()
	const task = new Balance()
	task.status = async () => mockStatus
	task.readSecrets = () => [
		'0x1111111111111111111111111111111111111111111111111111111111111111',
	]
	task.getCoreBalance = async () => '10'
	const kiaStartSpy = spy(Kia.prototype, 'start')
	const kiaSetSpy = spy(Kia.prototype, 'set')
	const kiaSucceedSpy = spy(Kia.prototype, 'succeed')
	const kiaFailSpy = spy(Kia.prototype, 'fail')
	const kiaStopSpy = spy(Kia.prototype, 'stop')

	await task.execute({})
	assertEquals(kiaStartSpy.calls.length, 1)
	assertEquals(kiaSetSpy.calls.length, 1)
	assertEquals(kiaSucceedSpy.calls.length, 1)
	assertSpyCallArgs(kiaSucceedSpy, 0, ['Genesis address[0] Balance: 10 CFX'])
	assertEquals(kiaFailSpy.calls.length, 0)
	assertEquals(kiaStopSpy.calls.length, 2)

	kiaStartSpy.restore()
	kiaSetSpy.restore()
	kiaSucceedSpy.restore()
	kiaFailSpy.restore()
	kiaStopSpy.restore()
	mockEnvClean()
})

Deno.test('Balance: execute should validate connection and retrieve balance for provided Core address', async () => {
	mockEnvSet()
	const task = new Balance()
	task.status = async () => mockStatus
	task.isCoreAddress = () => true
	task.getCoreBalance = async () => '10'
	const kiaStartSpy = spy(Kia.prototype, 'start')
	const kiaSetSpy = spy(Kia.prototype, 'set')
	const kiaSucceedSpy = spy(Kia.prototype, 'succeed')
	const kiaFailSpy = spy(Kia.prototype, 'fail')
	const kiaStopSpy = spy(Kia.prototype, 'stop')

	await task.execute({ address: 'cfx:aajsdfasjdflkj' })

	assertEquals(kiaStartSpy.calls.length, 1)
	assertEquals(kiaSetSpy.calls.length, 1)
	assertEquals(kiaSucceedSpy.calls.length, 1)
	assertSpyCallArgs(kiaSucceedSpy, 0, ['Core address balance: 10 CFX'])
	assertEquals(kiaFailSpy.calls.length, 0)
	assertEquals(kiaStopSpy.calls.length, 2)

	kiaStartSpy.restore()
	kiaSetSpy.restore()
	kiaSucceedSpy.restore()
	kiaFailSpy.restore()
	kiaStopSpy.restore()
	mockEnvClean()
})

Deno.test('Balance: execute should validate connection and retrieve balance for provided eSpace address', async () => {
	mockEnvSet()
	const task = new Balance()
	task.status = async () => mockStatus
	task.isCoreAddress = () => false
	task.isEspaceAddress = () => true
	task.viemClient.getBalance = async () => 1000000000000000000n
	const kiaStartSpy = spy(Kia.prototype, 'start')
	const kiaSetSpy = spy(Kia.prototype, 'set')
	const kiaSucceedSpy = spy(Kia.prototype, 'succeed')
	const kiaFailSpy = spy(Kia.prototype, 'fail')
	const kiaStopSpy = spy(Kia.prototype, 'stop')

	await task.execute({ address: '0x123123123' })

	assertEquals(kiaStartSpy.calls.length, 1)
	assertEquals(kiaSetSpy.calls.length, 1)
	assertEquals(kiaSucceedSpy.calls.length, 1)
	assertSpyCallArgs(kiaSucceedSpy, 0, ['ESpace address balance: 1 CFX'])
	assertEquals(kiaFailSpy.calls.length, 0)
	assertEquals(kiaStopSpy.calls.length, 2)

	kiaStartSpy.restore()
	kiaSetSpy.restore()
	kiaSucceedSpy.restore()
	kiaFailSpy.restore()
	kiaStopSpy.restore()
	mockEnvClean()
})

Deno.test('Balance: execute should handle invalid address gracefully', async () => {
	mockEnvSet()
	const task = new Balance()
	task.status = async () => mockStatus
	task.isCoreAddress = () => false
	task.isEspaceAddress = () => false

	const kiaStartSpy = spy(Kia.prototype, 'start')
	const kiaSetSpy = spy(Kia.prototype, 'set')
	const kiaSucceedSpy = spy(Kia.prototype, 'succeed')
	const kiaFailSpy = spy(Kia.prototype, 'fail')
	const kiaStopSpy = spy(Kia.prototype, 'stop')

	await task.execute({ address: 'invalid_address' })

	assertEquals(kiaStartSpy.calls.length, 1)
	assertEquals(kiaSetSpy.calls.length, 1)
	assertEquals(kiaSucceedSpy.calls.length, 0)
	assertSpyCallArgs(kiaFailSpy, 0, ['Invalid address'])
	assertEquals(kiaFailSpy.calls.length, 1)
	assertEquals(kiaStopSpy.calls.length, 2)

	kiaStartSpy.restore()
	kiaSetSpy.restore()
	kiaSucceedSpy.restore()
	kiaFailSpy.restore()
	kiaStopSpy.restore()
	mockEnvClean()
})

Deno.test('Balance: execute should handle errors gracefully', async () => {
	mockEnvSet()
	const task = new Balance()
	task.status = async () => {
		throw new Error('Network error')
	}
	const kiaStartSpy = spy(Kia.prototype, 'start')
	const kiaSetSpy = spy(Kia.prototype, 'set')
	const kiaSucceedSpy = spy(Kia.prototype, 'succeed')
	const kiaFailSpy = spy(Kia.prototype, 'fail')
	const kiaStopSpy = spy(Kia.prototype, 'stop')

	await task.execute({ address: 'cfx:aajsdfasjdflkj' })

	assertEquals(kiaStartSpy.calls.length, 1)
	assertEquals(kiaSetSpy.calls.length, 1)
	assertEquals(kiaSucceedSpy.calls.length, 0)
	assertSpyCallArgs(kiaFailSpy, 0, [
		'Failed to retrieve balance: Network error',
	])
	assertEquals(kiaFailSpy.calls.length, 1)
	assertEquals(kiaStopSpy.calls.length, 2)

	kiaStartSpy.restore()
	kiaSetSpy.restore()
	kiaSucceedSpy.restore()
	kiaFailSpy.restore()
	kiaStopSpy.restore()
	mockEnvClean()
})
