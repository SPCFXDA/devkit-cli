// import { assertEquals } from '@std/assert'
// import { ansi } from "cliffy/ansi";
// import { snapshotTest } from "cliffy/testing";
// import { KeystoreManager } from "./keystore_manager.ts";
// import { EncryptionService } from "./encryption_service.ts";
// import { MnemonicManager } from "./mnemonic_manager.ts";
// import { english, generateMnemonic } from "cive/accounts";

// // Mock dependencies
// const mockKeystoreManager = new KeystoreManager();
// const mockEncryptionService = new EncryptionService();
// const mnemonicManager = new MnemonicManager(mockKeystoreManager, mockEncryptionService);

// await snapshotTest({
// 	name: "MnemonicManager - Add mnemonic with encryption",
// 	meta: import.meta,
// 	stdin: ansi
//       .cursorDown
//       .text("\n") // Select "Store encrypted"
//       .text("test test test test test test test test test test test junk\n") // Enter mnemonic
//       .text("\n") // Accept default label
//       .toArray(),
// 	async fn() {
// 		mockKeystoreManager.setKeystore([]);
// 		mockKeystoreManager.setActiveIndex(0);

// 		const mockEncrypt = mockEncryptionService.encryptMnemonic;
// 		mockEncryptionService.encryptMnemonic = async (mnemonic) => `encrypted:${mnemonic}`;

// 		await mnemonicManager.addMnemonic();

// 		const keystore = mockKeystoreManager.getKeystore();
// 		assertEquals(keystore.length, 1);
// 		assertEquals(keystore[0].type, "encoded");
// 		assertEquals(keystore[0].mnemonic, "encrypted:test test test test test test test test test test test junk");
// 		assertEquals(keystore[0].label, "Mnemonic 1");

// 		mockEncryptionService.encryptMnemonic = mockEncrypt; // Restore original method
// 	  },
// })

// // Deno.test("MnemonicManager - Add mnemonic with encryption", async () => {
// //   // Mock CLI inputs for selecting encrypted storage and entering mnemonic
// //   await snapshotTest({
// //     name: "MnemonicManager - Add mnemonic with encryption",
// //     stdin: ansi
// //       .cursorDown
// //       .text("\n") // Select "Store encrypted"
// //       .text("test test test test test test test test test test test junk\n") // Enter mnemonic
// //       .text("\n") // Accept default label
// //       .toArray(),
// //     async fn() {
// //     },
// //   });
// // });

// // Deno.test("MnemonicManager - Add plaintext mnemonic", async () => {
// //   await snapshotTest({
// //     name: "MnemonicManager - Add plaintext mnemonic",
// //     stdin: ansi
// //       .cursorDown(2)
// //       .text("\n") // Select "Store in plaintext"
// //       .text("test test test test test test test test test test test junk\n") // Enter mnemonic
// //       .text("Custom Label\n") // Enter custom label
// //       .toArray(),
// //     async fn() {
// //       mockKeystoreManager.setKeystore([]);
// //       mockKeystoreManager.setActiveIndex(0);

// //       await mnemonicManager.addMnemonic();

// //       const keystore = mockKeystoreManager.getKeystore();
// //       assertEquals(keystore.length, 1);
// //       assertEquals(keystore[0].type, "plaintext");
// //       assertEquals(keystore[0].mnemonic, "test test test test test test test test test test test junk");
// //       assertEquals(keystore[0].label, "Custom Label");
// //     },
// //   });
// // });

// // Deno.test("MnemonicManager - Generate a new mnemonic", async () => {
// //   const originalGenerateMnemonic = generateMnemonic;
// //   generateMnemonic = () => "generated mnemonic test";

// //   await snapshotTest({
// //     name: "MnemonicManager - Generate a new mnemonic",
// //     stdin: ansi
// //       .text("\n") // Select "Generate a new mnemonic"
// //       .cursorDown
// //       .text("\n") // Select "Store in plaintext"
// //       .text("\n") // Accept default label
// //       .toArray(),
// //     async fn() {
// //       mockKeystoreManager.setKeystore([]);
// //       mockKeystoreManager.setActiveIndex(0);

// //       await mnemonicManager.addMnemonic();

// //       const keystore = mockKeystoreManager.getKeystore();
// //       assertEquals(keystore.length, 1);
// //       assertEquals(keystore[0].type, "plaintext");
// //       assertEquals(keystore[0].mnemonic, "generated mnemonic test");
// //       assertEquals(keystore[0].label, "Mnemonic 1");

// //       generateMnemonic = originalGenerateMnemonic; // Restore original function
// //     },
// //   });
// // });

// // Deno.test("MnemonicManager - Import an existing mnemonic", async () => {
// //   await snapshotTest({
// //     name: "MnemonicManager - Import an existing mnemonic",
// //     stdin: ansi
// //       .cursorDown
// //       .text("\n") // Select "Insert an existing mnemonic"
// //       .text("word1\n")
// //       .text("word2\n")
// //       .text("word3\n")
// //       .text("word4\n")
// //       .text("word5\n")
// //       .text("word6\n")
// //       .text("word7\n")
// //       .text("word8\n")
// //       .text("word9\n")
// //       .text("word10\n")
// //       .text("word11\n")
// //       .text("word12\n")
// //       .cursorDown
// //       .text("\n") // Select "Store in plaintext"
// //       .text("\n") // Accept default label
// //       .toArray(),
// //     async fn() {
// //       mockKeystoreManager.setKeystore([]);
// //       mockKeystoreManager.setActiveIndex(0);

// //       await mnemonicManager.addMnemonic();

// //       const keystore = mockKeystoreManager.getKeystore();
// //       assertEquals(keystore.length, 1);
// //       assertEquals(keystore[0].type, "plaintext");
// //       assertEquals(keystore[0].mnemonic, "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12");
// //       assertEquals(keystore[0].label, "Mnemonic 1");
// //     },
// //   });
// // });
