// deno-lint-ignore-file require-await
import { assertEquals, assertRejects, assertThrows } from '@std/assert'
import { assertSpyCallArgs, spy } from '@std/testing/mock'
import { NodeTask } from './node.ts'
import { ConfluxConfig } from '../config/mod.ts'
import { join } from '@std/path'
// import { delay } from '@std/async/delay'

const root_path = '/tmp/node.ts'

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

Deno.test('NodeTask: constructor should initialize environment and secrets', () => {
	mockEnvSet()
	const task = new NodeTask()
	task.setup()
	assertEquals(task.secrets.length, 1)
	assertEquals(task.env.NODE_ROOT, root_path)
	assertEquals(task.config.chain_id, 1234)
	mockEnvClean()
})

Deno.test('NodeTask: start method should return error code if pid exists', () => {
	mockEnvSet()
	const task = new NodeTask()
	task.getPid = () => '1234'
	const result = task.start()
	assertEquals(result.code, 1)
	assertEquals(result.pid, '1234')
	mockEnvClean()
})

// Deno.test("NodeTask: start method should spawn command if pid does not exist", () => {
//     mockEnvSet();
//     const task = new NodeTask();
//     const getPidSpy = spy(task, "getPid", () => null);
//     const commandSpy = spy(Deno, "Command", () => ({
//         spawn: () => ({
//             stderr: {
//                 pipeTo: async () => {},
//             },
//             unref: () => {},
//         }),
//     }));
//     const result = task.start();
//     assertEquals(result.code, 0);
//     assertEquals(result.pid, null);
//     getPidSpy.restore();
//     commandSpy.restore();
//     mockEnvClean();
// });

Deno.test('NodeTask: stop method should throw error if pid does not exist', () => {
	mockEnvSet()
	const task = new NodeTask()
	task.getPid = () => null
	assertThrows(() => task.stop(), Error, 'Node process not found')
	mockEnvClean()
})

Deno.test('NodeTask: stop method should kill process if pid exists', () => {
	mockEnvSet()
	const task = new NodeTask()
	task.getPid = () => '1234'
	const denoKillSpy = spy(Deno, 'kill')
	assertThrows(() => task.stop(), Error, 'ESRCH: No such process')
	assertEquals(denoKillSpy.calls.length, 1)
	assertSpyCallArgs(denoKillSpy, 0, [1234])
	denoKillSpy.restore()
	mockEnvClean()
})

Deno.test('NodeTask: logs method should throw error if log configuration file does not exist', async () => {
	mockEnvSet()
	const task = new NodeTask()
	task.config.log_conf = '/wrong/path'
	assertRejects(
		async () => await task.logs(),
		Error,
		'Log configuration file not found',
	)
	mockEnvClean()
})

Deno.test('NodeTask: logs method should throw error if log file specified in configuration not found', async () => {
	mockEnvSet()
	const task = new NodeTask()
	task.setup()
	assertRejects(
		async () => await task.logs(),
		Error,
		'Log file specified in configuration not found',
	)
	mockEnvClean()
})

// Deno.test("NodeTask: logs method should call tailF if log file exists", async () => {
//     mockEnvSet();
//     const task = new NodeTask();
//     const logConfPath = join(root_path, "log/config.yaml");
//     const logConfigString = `
//     appenders:
//       logfile:
//         path: ${join(root_path, "log/conflux.log")}
//     `;
//     await Deno.writeTextFile(logConfPath, logConfigString);
//     await Deno.writeTextFile(join(root_path, "log/conflux.log"), "aaaaaaa");
//     const tailFSpy = spy(task, "tailF");
//     await task.logs();
//     assertEquals(tailFSpy.calls.length, 1);
//     assertSpyCallArgs(tailFSpy, 0, [join(root_path, "log/conflux.log")]);
//     tailFSpy.restore();
//     // mockEnvClean();
// });

Deno.test('NodeTask: stderr method should return error message if stderr file does not exist', () => {
	mockEnvSet()
	const task = new NodeTask()
	assertThrows(
		() => task.stderr(),
		Error,
		"Error reading stderr file: No such file or directory (os error 2): readfile '/tmp/node.ts/log/stderr.txt'",
	)
	mockEnvClean()
})

Deno.test("NodeTask: stderr method should return 'No content to display from stderr.' if stderr file is empty", () => {
	mockEnvSet()
	const task = new NodeTask()
	task.setup()
	const stderrPath = join(root_path, 'log/stderr.txt')
	Deno.writeTextFileSync(stderrPath, '')
	const result = task.stderr()
	assertEquals(result, 'No content to display from stderr.')
	mockEnvClean()
})

Deno.test('NodeTask: stderr method should return stderr content if stderr file is not empty', () => {
	mockEnvSet()
	const task = new NodeTask()
	task.setup()
	const stderrPath = join(root_path, 'log/stderr.txt')
	Deno.writeTextFileSync(stderrPath, 'Error message\nAnother error message')
	const result = task.stderr()
	assertEquals(result, 'Error message\nAnother error message')
	mockEnvClean()
})

Deno.test('NodeTask: getPid should return null if server is not running', () => {
	mockEnvSet()
	const task = new NodeTask()
	const pid = task.getPid()
	assertEquals(pid, null)
	mockEnvClean()
})

// Deno.test('NodeTask: tailF function should output new lines added to a file', async () => {
// 	const tempFilePath = await Deno.makeTempFile()
// 	const expectedLines = ['First line', 'Second line', 'Third line']

// 	// Write initial content
// 	await Deno.writeTextFile(tempFilePath, expectedLines[0] + '\n')
// 	const task = new NodeTask()

// 	const abortController = new AbortController()
// 	const { signal } = abortController

// 	const _tailProcess = task.tailF(tempFilePath, signal)

// 	// Capture console output
// 	const output: string[] = []
// 	const originalConsoleLog = console.log
// 	console.log = (msg: string) => {
// 		output.push(msg)
// 	}

// 	try {
// 		// Simulate file modification
// 		await delay(50) // Allow some time for the watcher to start
// 		await Deno.writeTextFile(tempFilePath, expectedLines[1] + '\n', { append: true })
// 		await delay(50) // Wait for the watcher to detect the change
// 		await Deno.writeTextFile(tempFilePath, expectedLines[2] + '\n', { append: true })
// 		await delay(50) // Wait for the watcher to detect the change
// 		abortController.abort() // Stop the tailF function

// 		// Validate the output
// 		assertEquals(output, expectedLines.slice(1))
// 	} finally {
// 		// Restore original console.log
// 		console.log = originalConsoleLog

// 		// Cleanup
// 		abortController.abort() // Stop the tailF function
// 		//   await tailProcess;
// 		Deno.removeSync(tempFilePath)
// 	}
// })
