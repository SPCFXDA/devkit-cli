import { assertEquals } from '@std/assert'
import { assertSpyCall, assertSpyCallArgs, spy } from '@std/testing/mock'
import { BaseTask } from './base.ts' // Adjust the path to your file

Deno.test('BaseTask: execute method should throw an error if not overridden', async () => {
	const task = new BaseTask()
	const consoleErrorSpy = spy(console, 'error')
	await task.run()
	assertSpyCall(consoleErrorSpy, 0)
	assertSpyCallArgs(consoleErrorSpy, 0, [
		'execute method must be implemented by subclass',
	])
	consoleErrorSpy.restore()
})

Deno.test('BaseTask: run method should catch and format errors', async () => {
	class TestTask extends BaseTask {
		// deno-lint-ignore require-await
		protected override async execute(
			_options?: Record<string, unknown>,
		): Promise<void> {
			throw new Error('Test error')
		}
	}

	const task = new TestTask()
	const consoleErrorSpy = spy(console, 'error')
	await task.run()
	assertSpyCall(consoleErrorSpy, 0)
	assertSpyCallArgs(consoleErrorSpy, 0, ['Test error'])
})

Deno.test('BaseTask: formatError should format error objects correctly', () => {
	const task = new BaseTask()
	const error = new Error('Test error')
	const formattedError = task['formatError'](error) // Accessing protected method for testing
	assertEquals(formattedError, 'Test error')
})

Deno.test('BaseTask: formatError should handle non-error objects', () => {
	const task = new BaseTask()
	const error = 'Test error'
	const formattedError = task['formatError'](error) // Accessing protected method for testing
	assertEquals(formattedError, 'Test error')
})
