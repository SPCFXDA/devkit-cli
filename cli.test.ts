// import { assertEquals, assertStringIncludes } from "@std/assert";
// import { DevkitCLI } from "./cli.ts";
// import { ClientTask } from './src/task/mod.ts';
// import { Balance, Faucet, Scan, Wallet } from './src/commands/mod.ts'

// const mockStatus = {
//     bestHash: "0xa9",
//     blockNumber: 0,
//     chainId: 1,
//     epochNumber: 2,
//     ethereumSpaceChainId: 3,
//     latestCheckpoint: 4,
//     latestConfirmed: 5,
//     latestFinalized: 6,
//     latestState: 7,
//     networkId: 8,
//     pendingTxNumber: 9
//   }

// // Mock implementations
// class MockClientTask extends ClientTask{
//   start() { return { code: 0, pid: "1234" }; }
//   stop() {}
//   status() { return Promise.resolve(mockStatus); }
//   logs() { return Promise.resolve(); }
//   stderr() { return "Errors..."; }
// }

// class MockBalance extends Balance {
//   run({ _address }: { _address: string }) { return Promise.resolve(); }
// }

// class MockFaucet extends Faucet{
//   run({ value, to }: { value?: number; to?: string }) { return Promise.resolve(); }
// }

// class MockWallet extends Wallet{
//   run() { return Promise.resolve(); }
// }

// class MockScan extends Scan{
//   run() { return Promise.resolve(); }
// }

// Deno.test("DevkitCLI initializes correctly", () => {
//   const devkitCLI = new DevkitCLI();
//   // console.log(devkitCLI instanceof DevkitCLI);
//   // assertEquals(devkitCLI instanceof DevkitCLI, true);
// });

// Deno.test("DevkitCLI start command", async () => {
//   const devkitCLI = new DevkitCLI();
//   devkitCLI['cfxNode'] = new MockClientTask();

//   const output: string[] = [];
//   const originalConsoleLog = console.log;
//   console.log = (msg: string) => output.push(msg);

//   await devkitCLI['program'].parse(['start'], true);

//   assertStringIncludes(output[0], "Node is running");
//   console.log = originalConsoleLog;
// });

// Deno.test("DevkitCLI balance command", async () => {
//   const devkitCLI = new DevkitCLI();
//   devkitCLI['balance'] = new MockBalance();

//   const output: string[] = [];
//   const originalConsoleLog = console.log;
//   console.log = (msg: string) => output.push(msg);

//   await devkitCLI['program'].parse(['balance', '0xAddress'], true);

//   assertStringIncludes(output[0], "Balance of 0xAddress");
//   console.log = originalConsoleLog;
// });

// Deno.test("DevkitCLI faucet command", async () => {
//   const devkitCLI = new DevkitCLI();
//   devkitCLI['faucet'] = new MockFaucet();

//   const output: string[] = [];
//   const originalConsoleLog = console.log;
//   console.log = (msg: string) => output.push(msg);

//   await devkitCLI['program'].parse(['faucet', '100', '0xAddress'], true);

//   assertStringIncludes(output[0], "Faucet sent 100 to 0xAddress");
//   console.log = originalConsoleLog;
// });

// Deno.test("DevkitCLI wallet command", async () => {
//   const devkitCLI = new DevkitCLI();
//   devkitCLI['wallet'] = new MockWallet();

//   const output: string[] = [];
//   const originalConsoleLog = console.log;
//   console.log = (msg: string) => output.push(msg);

//   await devkitCLI['program'].parse(['wallet'], true);

//   assertStringIncludes(output[0], "Wallet configured");
//   console.log = originalConsoleLog;
// });
