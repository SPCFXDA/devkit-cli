import { assertEquals } from '@std/assert'
import { ConfluxConfig } from './env.ts'
import { join } from '@std/path'

function mockEnvClean() {
	Object.keys(new ConfluxConfig()).forEach((property) => {
		Deno.env.delete(property)
	})
}

Deno.test('Default values when environment variables are not set', () => {
	// Clear environment variables
	mockEnvClean() //this don't seems to work

	Deno.env.delete('CONFLUX_NODE_ROOT')
	Deno.env.delete('CONFLUX_CONFIG_PATH')
	Deno.env.delete('CONFLUX_LOG')
	Deno.env.delete('CONFLUX_LOG_FILE')
	Deno.env.delete('CONFLUX_LOG_ARCHIVE')
	Deno.env.delete('CONFLUX_LOG_CONFIG')
	Deno.env.delete('CONFLUX_SECRETS_PATH')
	Deno.env.delete('CONFLUX_NODE_DATA')
	Deno.env.delete('CONFLUX_POS_ROOT')
	Deno.env.delete('CONFLUX_POS_DATA')
	Deno.env.delete('CONFLUX_POS_GENESIS')
	Deno.env.delete('CONFLUX_POS_LOG')
	Deno.env.delete('CONFLUX_POS_CONFIG')
	Deno.env.delete('CONFLUX_POS_NODES')
	Deno.env.delete('CONFLUX_POS_KEY')
	Deno.env.delete('CONFLUX_POS_KEY_PWD')
	Deno.env.delete('CONFLUX_CHAIN_ID')
	Deno.env.delete('CONFLUX_EVM_CHAIN_ID')
	const env = new ConfluxConfig()
	// Check default values
	assertEquals(env.NODE_ROOT, join('/opt', 'conflux'))
	assertEquals(env.CONFIG_PATH, join(env.NODE_ROOT, 'develop.toml'))
	assertEquals(env.LOG, join(env.NODE_ROOT, 'log'))
	assertEquals(env.LOG_FILE, join(env.LOG, 'conflux.log'))
	assertEquals(env.LOG_ARCHIVE, join(env.LOG, 'archive', 'conflux.{}.gz'))
	assertEquals(env.SECRETS_PATH, join(env.NODE_ROOT, 'secrets.txt'))
	assertEquals(env.NODE_DATA, join(env.NODE_ROOT, 'blockchain_data'))
	assertEquals(env.POS_ROOT, join(env.NODE_ROOT, 'pos_config'))
	assertEquals(env.POS_DATA, join(env.POS_ROOT, 'pos_db'))
	assertEquals(env.POS_GENESIS, join(env.POS_ROOT, 'genesis_file'))
	assertEquals(env.POS_LOG, join(env.LOG, 'pos.log'))
	assertEquals(env.POS_CONFIG, join(env.POS_ROOT, 'pos_config.yaml'))
	assertEquals(env.POS_NODES, join(env.POS_ROOT, 'initial_nodes.json'))
	assertEquals(env.POS_KEY, join(env.POS_ROOT, 'pos_key'))
	assertEquals(env.POS_KEY_PWD, 'CFXV20')
	assertEquals(env.CHAIN_ID, 2029)
	assertEquals(env.EVM_CHAIN_ID, 2030)
})

Deno.test('Values from environment variables', () => {
	// Set environment variables
	mockEnvClean()
	Deno.env.set('CONFLUX_NODE_ROOT', '/custom/path/conflux')
	Deno.env.set('CONFLUX_CONFIG_PATH', '/custom/path/conflux/develop.toml')
	Deno.env.set('CONFLUX_LOG', '/custom/path/conflux/log')
	Deno.env.set('CONFLUX_LOG_FILE', '/custom/path/conflux/log/conflux.log')
	Deno.env.set(
		'CONFLUX_LOG_ARCHIVE',
		'/custom/path/conflux/log/archive/conflux.{}.gz',
	)
	Deno.env.set('CONFLUX_LOG_CONFIG', '/custom/path/conflux/log/config.yaml')
	Deno.env.set('CONFLUX_SECRETS_PATH', '/custom/path/conflux/secrets.txt')
	Deno.env.set('CONFLUX_NODE_DATA', '/custom/path/node/data')
	Deno.env.set('CONFLUX_POS_ROOT', '/custom/path/pos/root')
	Deno.env.set('CONFLUX_POS_DATA', '/custom/path/pos/data')
	Deno.env.set('CONFLUX_POS_GENESIS', '/custom/path/pos/genesis')
	Deno.env.set('CONFLUX_POS_LOG', '/custom/path/pos/log')
	Deno.env.set('CONFLUX_POS_CONFIG', '/custom/path/pos/config')
	Deno.env.set('CONFLUX_POS_NODES', '/custom/path/pos/nodes')
	Deno.env.set('CONFLUX_POS_KEY', '/custom/path/pos/key')
	Deno.env.set('CONFLUX_POS_KEY_PWD', 'ABCD123')

	Deno.env.set('CONFLUX_CHAIN_ID', '1234')
	Deno.env.set('CONFLUX_EVM_CHAIN_ID', '5678')

	const env = new ConfluxConfig()

	// Check environment variable values
	assertEquals(env.NODE_ROOT, '/custom/path/conflux')
	assertEquals(env.CONFIG_PATH, '/custom/path/conflux/develop.toml')
	assertEquals(env.LOG, '/custom/path/conflux/log')
	assertEquals(env.LOG_FILE, '/custom/path/conflux/log/conflux.log')
	assertEquals(
		env.LOG_ARCHIVE,
		'/custom/path/conflux/log/archive/conflux.{}.gz',
	)
	assertEquals(env.LOG_CONFIG, '/custom/path/conflux/log/config.yaml')
	assertEquals(env.SECRETS_PATH, '/custom/path/conflux/secrets.txt')
	assertEquals(env.NODE_DATA, '/custom/path/node/data')
	assertEquals(env.POS_ROOT, '/custom/path/pos/root')
	assertEquals(env.POS_DATA, '/custom/path/pos/data')
	assertEquals(env.POS_GENESIS, '/custom/path/pos/genesis')
	assertEquals(env.POS_LOG, '/custom/path/pos/log')
	assertEquals(env.POS_CONFIG, '/custom/path/pos/config')
	assertEquals(env.POS_NODES, '/custom/path/pos/nodes')
	assertEquals(env.POS_KEY, '/custom/path/pos/key')
	assertEquals(env.POS_KEY_PWD, 'ABCD123')

	assertEquals(env.CHAIN_ID, 1234)
	assertEquals(env.EVM_CHAIN_ID, 5678)
	mockEnvClean()
})
