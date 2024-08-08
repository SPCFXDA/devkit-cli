/**
 * @module tasks
 * This module exports the various task classes used for managing and interacting with the Conflux and ESpace blockchains.
 * The tasks include base functionality, setup tasks, node control tasks, and client interaction tasks.
 *
 * @example
 * // Importing the tasks
 * import { BaseTask, SetupTask, NodeTask, ClientTask } from './tasks/mod.ts'
 *
 * // Example usage of SetupTask
 * const setupTask = new SetupTask()
 * setupTask.run().then(() => console.log('Setup complete'))
 *
 * @example
 * // Example usage of NodeTask
 * const nodeTask = new NodeTask()
 * nodeTask.start()
 *
 * @example
 * // Example usage of ClientTask
 * const clientTask = new ClientTask()
 * clientTask.getCoreBalance('cfxtest:aak2rra2njvd77ezwjvx04kkds9fzagfe6d5r8e957')
 *   .then(balance => console.log('Core balance:', balance))
 */

export { BaseTask } from './base.ts'
export { SetupTask } from './setup.ts'
export { NodeTask } from './node.ts'
export { ClientTask } from './client.ts'
