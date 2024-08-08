/**
 * A module exporting blockchain-related classes for faucet operations, balance retrieval, wallet management, and transaction scanning.
 *
 * @module
 * @example
 * import { Faucet, Balance, Wallet, Scan } from 'your-module-path';
 *
 * // Example usage of Faucet
 * const faucet = new Faucet();
 * await faucet.execute({ value: '10', to: '0x123...' });
 *
 * // Example usage of Balance
 * const balance = new Balance();
 * await balance.execute({ address: '0x123...' });
 *
 * // Example usage of Wallet
 * const wallet = new Wallet();
 * console.log(wallet.getAddress());
 *
 * // Example usage of Scan
 * const scan = new Scan();
 * await scan.execute();
 */
export { Faucet } from './faucet.ts'
export { Balance } from './balance.ts'
export { Wallet } from './wallet.ts'
export { Scan } from './scan.ts'
