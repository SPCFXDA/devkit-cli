export interface Block {
	blockNumber?: bigint
	timestamp: bigint | number
	number?: bigint // For espace block
}

export interface BlockInfo {
	number: bigint
	timestamp: string
	label: string
}

export interface Transaction {
	hash: string
	from: string
	to: `0x${string}` | null
	value: bigint | string
	gas: bigint
	gasPrice?: bigint | undefined
}
