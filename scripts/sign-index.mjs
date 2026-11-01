// Signs static/index.json, writing static/index.json.sig: a detached ed25519 signature over the
// file's exact bytes, in the shape Marmot verifies ({"key_id", "signature" (base64)}).
//
// PLUGIN_INDEX_SIGNING_KEY holds the base64 ed25519 private key as Go writes it (32-byte seed
// followed by the 32-byte public key), from `go run ./tools/plugin-index keygen` in the marmot
// repo. PLUGIN_INDEX_KEY_ID must match the key's entry in marmot's
// internal/plugin/index/trusted_keys.json.
//
// Usage:
//   PLUGIN_INDEX_SIGNING_KEY=... node scripts/sign-index.mjs

import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = resolve(root, 'static', 'index.json');
const sigPath = resolve(root, 'static', 'index.json.sig');

const keyId = process.env.PLUGIN_INDEX_KEY_ID ?? 'marmot-plugins-2026';
const raw = Buffer.from(process.env.PLUGIN_INDEX_SIGNING_KEY ?? '', 'base64');
if (raw.length !== 64) {
	console.error('PLUGIN_INDEX_SIGNING_KEY must hold a base64 ed25519 private key (64 bytes)');
	process.exit(1);
}

const b64url = (buf) => buf.toString('base64url');
const jwk = {
	kty: 'OKP',
	crv: 'Ed25519',
	d: b64url(raw.subarray(0, 32)),
	x: b64url(raw.subarray(32))
};
const privateKey = createPrivateKey({ key: jwk, format: 'jwk' });
const publicKey = createPublicKey(privateKey);

const data = readFileSync(indexPath);
const signature = sign(null, data, privateKey);

// Catch a seed and public half that do not belong together before every Marmot does.
if (!verify(null, data, publicKey, signature)) {
	console.error('signature does not verify against the key it was made with');
	process.exit(1);
}
const derived = publicKey.export({ format: 'jwk' }).x;
if (derived !== jwk.x) {
	console.error('the public half of PLUGIN_INDEX_SIGNING_KEY does not match its seed');
	process.exit(1);
}

writeFileSync(
	sigPath,
	JSON.stringify({ key_id: keyId, signature: signature.toString('base64') }) + '\n'
);
console.log(
	`Signed ${indexPath} with ${keyId}; public key ${Buffer.from(derived, 'base64url').toString('base64')}`
);
