// deno-lint-ignore-file require-await
import { assertEquals } from '@std/assert'
import { spy, stub } from '@std/testing/mock'
import { Scan } from '../commands/mod.ts' // Adjust the path to your file
import { Block } from 'viem'

Deno.test('Scan: coreScan should log transactions', async () => {
	const scan = new Scan()
	scan.clear = async (interval) => {
		await new Promise((resolve) => setTimeout(resolve, scan.config.dev_block_interval_ms + 100))
		clearInterval(interval)
	}
	const mockBlock = {
		adaptive: false,
		baseFeePerGas: 1,
		blame: 0,
		blockNumber: 127397,
		custom: ['0x04'],
		deferredLogsBloomHash: '0xd397b3b043d87fcd6fad1291ff0bfd16401c274896d8c63a923727f077b8e0b5',
		deferredReceiptsRoot: '0x09f8709ea9f344a810811a373b30861568f5686e649d6177fd92ea2db7477508',
		deferredStateRoot: '0x054285420fbeb445cbd4105f5d8eb019a7aafdb908fef196b7ececc1e88cb489',
		difficulty: 4,
		epochNumber: 127397,
		gasLimit: 60000000,
		gasUsed: undefined,
		hash: '0xc1cccd968590d1d9f10a75568933545e35afc6a798182d64cac42c8eda6d3992',
		height: 127397,
		miner: 'NET2029:TYPE.USER:AASHPJNUVYFA3BB0NDBC0YUB44RXC0PDYYMNDPEYU7',
		nonce: 0x7dd83a5be4684d73,
		parentHash: '0x8ad771012f126405f2ca436b25ee8c0734d439094d3c64221768a3133692d3ca',
		posReference: '0x0000000000000000000000000000000000000000000000000000000000000000',
		powQuality: '0x4',
		refereeHashes: [],
		size: 126,
		timestamp: 1722878767,
		transactions: [
			{
				accessList: [],
				blockHash: undefined,
				chainId: 2029,
				contractCreated: undefined,
				data: '0x',
				epochHeight: 127396,
				from: 'NET2029:TYPE.USER:AASHPJNUVYFA3BB0NDBC0YUB44RXC0PDYYMNDPEYU7',
				gas: 21000,
				gasPrice: 3333335,
				hash: '0xf1f04919885b6dcc36ac01940f28afc16b7e49b4b1028f7579b8a1ebbd5e36ed',
				maxFeePerGas: 3333335,
				maxPriorityFeePerGas: 3333333,
				nonce: 90,
				r: '0x7dee504e4ce08022c78fccc0d6b84d5f4edc37c1f2d414b6743f669ddb08d0ae',
				s: '0x3d7003638b13734b3d8a96e01e958b083d4f32f5fccef30f541e22047bdda068',
				status: undefined,
				storageLimit: 0,
				to: 'NET2029:TYPE.USER:AAP3R3HUV53NE832GUK5J3PYKR0RFJ15YE7HDU2U7K',
				transactionIndex: undefined,
				type: 2,
				v: 0,
				value: 12000000000000000000,
				yParity: 0,
			},
		],
		transactionsRoot: '0x0a820b68c46468757ff14d4d3117479c016b819ad5f363d5834a5d1cfbbbfa17',
	}

	const getBlockByEpochNumberStub = stub(
		scan.confluxClient,
		'getBlockByEpochNumber',
		async () => mockBlock,
	)
	const formatEtherStub = stub(
		scan,
		'formatEther',
		(value) => value.toString(),
	)
	const logTxSpy = spy(scan, 'logTx')

	scan.coreScan()

	await new Promise((resolve) => setTimeout(resolve, scan.config.dev_block_interval_ms + 100))

	assertEquals(scan.coreBlock, mockBlock.blockNumber)
	assertEquals(logTxSpy.calls.length, mockBlock.transactions.length)
	assertEquals(logTxSpy.calls[0].args[0], mockBlock.transactions[0].hash)

	getBlockByEpochNumberStub.restore()
	formatEtherStub.restore()
	logTxSpy.restore()
})

Deno.test('Scan: espaceScan should log transactions', async () => {
	const scan = new Scan()
	const mockBlock: Block = {
		sealFields: ['0x123'],
		baseFeePerGas: 1n,
		difficulty: 4n,
		extraData: '0x',
		gasLimit: 60000000n,
		gasUsed: 0n,
		hash: '0xd521aab39c77028cda076e7985e2e37a2c8b7ec6565a5af024861ecde94f8076',
		logsBloom:
			'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
		miner: '0x1c7621708d0a0c843658c22b5201d69b315983a5',
		mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
		nonce: '0x465374a8cecab7ad',
		number: 128502n,
		parentHash: '0xe1341bcbe3080887ad2c9604cf7171baef28fe6b6fc2c91636ee8418d944d9d2',
		receiptsRoot: '0x09f8709ea9f344a810811a373b30861568f5686e649d6177fd92ea2db7477508',
		sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
		size: 187n,
		stateRoot: '0x5538bc9aec46e0a6f17b275d2eca4c5d43db6f0ec9474bd7eceb7db70ec6e78e',
		timestamp: 1722879322n,
		totalDifficulty: 0n,
		transactions: [
			{
				blockHash: '0xd521aab39c77028cda076e7985e2e37a2c8b7ec6565a5af024861ecde94f8076',
				blockNumber: 128502n,
				chainId: 2030,
				from: '0x0000000000000000000000000000000000000000',
				gas: 0n,
				gasPrice: 0n,
				hash: '0x7bbcfc3ec232ace168d4d94f5eec7c71962ede0b910e87a95c6d037295b36078',
				input:
					'0x0bd93e90a7925fd9e32aec9628de8515c9c7a97d7ef01967877cc31da36ea22a0000000000000000000000000000000000000000000000000000000000000000',
				nonce: 0,
				r: '0x0',
				s: '0x0',
				to: '0x820c31ebe8248927759d5ca5efdcc04854ac8659',
				transactionIndex: 0,
				type: 'legacy',
				v: 4095n,
				value: 12000000000000000000n,
				typeHex: '0x0',
			},
			{
				blockHash: '0xd521aab39c77028cda076e7985e2e37a2c8b7ec6565a5af024861ecde94f8076',
				blockNumber: 128502n,
				chainId: 2030,
				from: '0x820c31ebe8248927759d5ca5efdcc04854ac8659',
				gas: 0n,
				gasPrice: 0n,
				hash: '0x9e0ae097ee0447caed44f301f31f1ada01b1934ad622e3e73397ecf8b8f03590',
				input: '0x',
				nonce: 78,
				r: '0x820c31ebe8248927759d5ca5efdcc04854ac8659',
				s: '0x820c31ebe8248927759d5ca5efdcc04854ac8659',
				to: '0x1037dce9a3c0b61fce03dab1ba3393101758f53b',
				transactionIndex: 1,
				type: 'legacy',
				v: 4095n,
				value: 12000000000000000000n,
				typeHex: '0x0',
			},
		],
		transactionsRoot: '0x3960f8c944cbb651d5e20029f0ab585982edabdccb2c73fc492edd2aaf5f2c1c',
		uncles: [],
		blobGasUsed: 0n,
		excessBlobGas: 0n,
	}

	const watchBlocksStub = stub(
		scan.viemClient,
		'watchBlocks',
		({ onBlock }) => {
			onBlock(mockBlock, mockBlock) // Provide both block and prevBlock
			return () => {} // Return an unwatch function
		},
	)
	const getBlockStub = stub(
		scan.viemClient,
		'getBlock',
		async () => mockBlock,
	)
	const formatEtherStub = stub(
		scan,
		'formatEther',
		(value) => value.toString(),
	)
	const logTxSpy = spy(scan, 'logTx')

	scan.espaceScan()

	await new Promise((resolve) => setTimeout(resolve, 100))

	assertEquals(scan.espaceBlock, mockBlock.number)
	assertEquals(logTxSpy.calls.length, mockBlock.transactions.length)
	// assertEquals(logTxSpy.calls[0].args[0], mockBlock.transactions[0].hash);

	watchBlocksStub.restore()
	getBlockStub.restore()
	formatEtherStub.restore()
	logTxSpy.restore()
})
