// deno-lint-ignore-file require-await
import { assertEquals, assertRejects } from '@std/assert'
import { ClientTask } from './client.ts' // Adjust the path to your file
import { ConfluxConfig } from '../config/mod.ts'

const root_path = '/tmp/client.ts'

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

Deno.test('ClientTask: constructor should initialize clients and configuration', () => {
	mockEnvSet()
	const task = new ClientTask()
	assertEquals(task.retryCount, 5)
	assertEquals(task.delayMs, 3000)
	assertEquals(task.config.chain_id, 1234)
	mockEnvClean()
})

Deno.test('ClientTask: getCoreBalance should fetch balance and convert to CFX', async () => {
	mockEnvSet()
	const task = new ClientTask()
	task.confluxClient.cfx.getBalance = async () => '1000000000000000000'
	const balance = await task.getCoreBalance('cfx:aajsdfasjdflkj')
	assertEquals(balance, '1')
	mockEnvClean()
})

Deno.test('ClientTask: getCoreBalance should handle errors gracefully', async () => {
	mockEnvSet()
	const task = new ClientTask()
	task.confluxClient.cfx.getBalance = async () => {
		throw new Error('Failed to fetch balance')
	}
	await assertRejects(
		async () => await task.getCoreBalance('cfx:aajsdfasjdflkj'),
		Error,
		'Failed to fetch balance',
	)
	mockEnvClean()
})

Deno.test('ClientTask: getESpaceBalance should fetch balance and convert to Ether', async () => {
	mockEnvSet()
	const task = new ClientTask()
	task.viemClient.getBalance = async () => BigInt('1000000000000000000')
	const balance = await task.getESpaceBalance('0xajsdfasjdflkj')
	assertEquals(balance, '1')
	mockEnvClean()
})

Deno.test('ClientTask: getESpaceBalance should handle errors gracefully', async () => {
	mockEnvSet()
	const task = new ClientTask()
	task.viemClient.getBalance = async () => {
		throw new Error('Failed to fetch balance')
	}
	await assertRejects(
		async () => await task.getESpaceBalance('0xajsdfasjdflkj'),
		Error,
		'Failed to fetch balance',
	)
	mockEnvClean()
})

Deno.test('ClientTask: fromCfx should convert CFX to Drip', () => {
	mockEnvSet()
	const task = new ClientTask()
	const result = task.fromCfx('1')
	assertEquals(result.toString(), '1000000000000000000')
	mockEnvClean()
})

Deno.test('ClientTask: isCoreAddress should validate Core addresses', () => {
	mockEnvSet()
	const task = new ClientTask()
	const result = task.isCoreAddress(
		'net2029:aashpjnuvyfa3bb0ndbc0yub44rxc0pdyymndpeyu7',
	)
	assertEquals(result, true)
	mockEnvClean()
})

Deno.test('ClientTask: isEspaceAddress should validate ESpace addresses', () => {
	mockEnvSet()
	const task = new ClientTask()
	const result = task.isEspaceAddress(
		'0xb794f5ea0ba39494ce839613fffba74279579268',
	)
	assertEquals(result, true)
	mockEnvClean()
})

Deno.test('ClientTask: status should fetch chain status with retries', async () => {
	mockEnvSet()
	const task = new ClientTask()
	task.getPid = () => '1234'
	task.confluxClient.cfx.getStatus = async () => ({ networkId: 1234 })
	const result = await task.status()
	assertEquals(result.networkId, 1234)
	mockEnvClean()
})

Deno.test('ClientTask: status should handle errors and retry', async () => {
	mockEnvSet()
	const task = new ClientTask()
	task.getPid = () => '1234'
	task.delayMs = 5
	let attempt = 0
	task.confluxClient.cfx.getStatus = async () => {
		attempt++
		if (attempt < 5) {
			throw new Error('Network error')
		}
		return { networkId: 1234 }
	}
	const result = await task.status()
	assertEquals(result.networkId, 1234)
	assertEquals(attempt, 5)
	mockEnvClean()
})

Deno.test('ClientTask: status should throw error if retries exceed', async () => {
	mockEnvSet()
	const task = new ClientTask()
	task.getPid = () => '1234'
	task.delayMs = 5
	task.confluxClient.cfx.getStatus = async () => {
		throw new Error('Network error')
	}
	await assertRejects(async () => await task.status(), Error, 'Network error')
	mockEnvClean()
})
