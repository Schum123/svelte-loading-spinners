import { writeFile } from 'node:fs/promises';
import packageJson from '../package/package.json';

const json = {
	...packageJson,
	svelte: undefined,
	exports: {
		...packageJson.exports,
		'.': {
			svelte: './index.js',
			default: './index.js'
		}
	}
};

await writeFile('package/package.json', JSON.stringify(json, null, 2));
