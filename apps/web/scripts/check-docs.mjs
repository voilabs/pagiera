import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const result=spawnSync(process.execPath,[fileURLToPath(new URL('../../../scripts/check-docs.cjs',import.meta.url))],{stdio:'inherit'});process.exit(result.status??1);
