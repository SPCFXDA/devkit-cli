import { BaseTask, SetupTask, NodeTask, ClientTask, DevConfigGenerator, PosConfigGenerator, LogConfigGenerator, ConfluxConfig, Faucet, Balance, Wallet, Scan } from './mod.ts'

Deno.test('Validatio Task Classes', (): void  => {
	[BaseTask, SetupTask, NodeTask, ClientTask].forEach(cls => {
		const _test = new cls();
	});
})

Deno.test('Validatio Command Classes', (): void  => {
	[Faucet, Balance, Wallet, Scan].forEach(cls => {
		const _test = new cls();
	});
})

Deno.test('Validatio Config Classes', (): void => {
	const env = new ConfluxConfig()
	const _dev = new DevConfigGenerator(env)
	const _log = new LogConfigGenerator(env)
	const _pos = new PosConfigGenerator(env, 1234)
})

