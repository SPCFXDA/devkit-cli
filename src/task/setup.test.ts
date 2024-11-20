import { assertEquals } from '@std/assert'
import { assertSpyCall, assertSpyCallArgs, spy } from '@std/testing/mock'
import { SetupTask } from './setup.ts' // Adjust the path to your file
import { ConfluxConfig } from '../config/mod.ts'
import * as toml from '@std/toml'
import { existsSync } from '@std/fs'
const root_path = '/tmp/setup.ts'

function removeArtifacts() {
	try {
		Deno.removeSync(root_path, { recursive: true })
	} catch {
		// Do nothing is don't exist
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

Deno.test('SetupTask: constructor should initialize environment and secrets', () => {
	mockEnvSet()
	const task = new SetupTask()
	task.setup()
	assertEquals(task.secrets.length, 1)
	assertEquals(task.env.NODE_ROOT, root_path)
	assertEquals(task.config.chain_id, 1234)
	mockEnvClean()
})

Deno.test('SetupTask: setup method should handle errors gracefully', () => {
	mockEnvSet()
	class TestSetupTask extends SetupTask {
		override generateLogConfig() {
			throw new Error('Log config error')
		}
	}

	const task = new TestSetupTask()
	const consoleErrorSpy = spy(console, 'error')
	task.setup()
	assertSpyCall(consoleErrorSpy, 0)
	assertSpyCallArgs(consoleErrorSpy, 0, [
		'An error occurred during initialization:',
		'Log config error',
	])
	consoleErrorSpy.restore()
	mockEnvClean()
})

Deno.test('SetupTask: secretExist should return false when secrets file does not exist', () => {
	mockEnvSet()

	const task = new SetupTask()
	const result = task.secretExist()
	assertEquals(result, false)
	mockEnvClean()
})

Deno.test('SetupTask: writeSecrets should write secrets to file', () => {
	mockEnvSet()

	const task = new SetupTask()
	task.secrets = ['0xabcdef']
	const writeTextFileSyncSpy = spy(Deno, 'writeTextFileSync')
	task.writeSecrets()
	assertSpyCall(writeTextFileSyncSpy, 0)
	assertSpyCallArgs(writeTextFileSyncSpy, 0, [
		task.config.genesis_secrets,
		'abcdef\n',
	])
	writeTextFileSyncSpy.restore()
	mockEnvClean()
})

Deno.test('SetupTask: writeConfig should write config to file', () => {
	mockEnvSet()

	const task = new SetupTask()
	const writeTextFileSyncSpy = spy(Deno, 'writeTextFileSync')
	task.writeConfig()
	assertSpyCall(writeTextFileSyncSpy, 0)
	assertSpyCallArgs(writeTextFileSyncSpy, 0, [
		task.env.CONFIG_PATH,
		toml.stringify(task.config as unknown as Record<string, unknown>),
	])
	writeTextFileSyncSpy.restore()
	mockEnvClean()
})

Deno.test('SetupTask: generateSecrets should generate new secrets if they do not exist', () => {
	mockEnvSet()

	const task = new SetupTask()
	const writeSecretsSpy = spy(task, 'writeSecrets')
	const writeConfigSpy = spy(task, 'writeConfig')

	task.generateSecrets()

	assertEquals(task.secrets.length, 1)
	assertEquals(writeSecretsSpy.calls.length, 1)
	assertEquals(writeConfigSpy.calls.length, 0)
	writeSecretsSpy.restore()
	writeConfigSpy.restore()
	mockEnvClean()
})

Deno.test('SetupTask: generatePosConfig should create POS config if it does not exist', async () => {
	mockEnvSet()
	const task = new SetupTask()
	await task.generatePosConfig()
	assertEquals(existsSync(task.config.pos_config_path), true)
	mockEnvClean()
})

Deno.test('SetupTask: generateLogConfig should create log config if it does not exist', () => {
	mockEnvSet()

	const task = new SetupTask()
	task.generateLogConfig()
	assertEquals(existsSync(task.config.log_conf), true)
	mockEnvClean()
})

Deno.test('SetupTask: readSecrets should read and format secrets from file', () => {
	mockEnvSet()

	const task = new SetupTask()
	Deno.writeTextFileSync(
		task.config.genesis_secrets,
		'abcdef\nghijkl\n',
	)
	task.generateSecrets()
	assertEquals(task.secrets, ['0xabcdef', '0xghijkl'])
	mockEnvClean()
})
