/**
 * Represents a base class for tasks, providing a structure for running tasks with error handling.
 * Subclasses should implement the `execute` method to define specific task logic.
 */
export class BaseTask {
	/**
	 * Constructs a new BaseTask instance.
	 */
	constructor() {}

	/**
	 * Runs the task with the given options, providing error handling.
	 * @param {Record<string, unknown>} [options] - The options to be passed to the task.
	 * @returns {Promise<void>} A promise that resolves when the task is complete.
	 * @example
	 * const task = new MyTask();
	 * await task.run({ someOption: 'value' });
	 */
	async run(options?: Record<string, unknown>): Promise<void> {
		try {
			await this.execute(options)
		} catch (error) {
			console.error(this.formatError(error))
		}
	}

	/**
	 * Executes the task with the given options. This method should be overridden by subclasses to provide specific task logic.
	 * @param {Record<string, unknown>} [_options] - The options to be used by the task.
	 * @returns {Promise<void>} A promise that resolves when the task execution is complete.
	 * @throws Will throw an error if the method is not overridden by a subclass.
	 */
	// deno-lint-ignore require-await
	protected async execute(_options?: Record<string, unknown>): Promise<void> {
		throw new Error('execute method must be implemented by subclass')
	}

	/**
	 * Formats the error into a string message.
	 * @param {unknown} error - The error to format.
	 * @returns {string} The formatted error message.
	 */
	protected formatError(error: unknown): string {
		if (error instanceof Error) {
			return error.message
		}
		return String(error)
	}
}
