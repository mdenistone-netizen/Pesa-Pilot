// DB-4 reference model: protected backup key architecture. REVISION 2 (26 Nov): "public key on the phone".
// PLANNING ARTEFACT ONLY. Not part of the app, never loaded by index.html. Run: node model.js
// Uses the same Web Crypto API the browser provides (Node 22 exposes it as globalThis.crypto).
//
// Why revision 2: a browser test showed that a NON-EXTRACTABLE key stored on the phone can still be
// retrieved and USED by any same-origin code (page, service worker, injected script) to DECRYPT backups.
// Non-extractable only stops the key's value being copied out. Revision 2 removes every decrypting key
// from the phone: the phone keeps only a PUBLIC key, which can lock new backups but cannot open any.
"use strict";
const subtle = globalThis.crypto.subtle, rnd = n => globalThis.crypto.getRandomValues(new Uint8Array(n));
const b64 = u8 => Buffer.from(u8).toString("base64"), unb64 = s => new Uint8Array(Buffer.from(s, "base64"));
const enc = new TextEncoder(), dec = new TextDecoder();
const ROUNDS = 600000, CURVE = { name: "ECDH", namedCurve: "P-256" };

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";   // Crockford base32: no I, L, O, U
function newRecoveryCode() { const b = rnd(16); let s = ""; for (const x of b) s += ALPHABET[x & 31]; return s.match(/.{4}/g).join("-"); } // 80 bits
const normaliseCode = c => c.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");

// Lock key (P-key or R-key): derived from a secret; only ever locks/unlocks the PRIVATE key. Never stored.
async function deriveLockKey(secret, salt) {
  const base = await subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ROUNDS }, base, { name: "AES-GCM", length: 256 }, false, ["wrapKey", "unwrapKey"]);
}
async function lockPrivate(privateKey, secret) {
  const salt = rnd(16), iv = rnd(12), k = await deriveLockKey(secret, salt);
  return { salt: b64(salt), iv: b64(iv), wrapped: b64(new Uint8Array(await subtle.wrapKey("pkcs8", privateKey, k, { name: "AES-GCM", iv }))) };
}
async function unlockPrivate(lock, secret) {
  const k = await deriveLockKey(secret, unb64(lock.salt));
  return subtle.unwrapKey("pkcs8", unb64(lock.wrapped), k, { name: "AES-GCM", iv: unb64(lock.iv) }, CURVE, true, ["deriveBits"]);
}
// File key for ONE backup: ECDH(one-time key, backup public key) → HKDF-SHA-256 → AES-GCM-256.
async function fileKey(privateKey, publicKey, salt) {
  const bits = await subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256);
  const hk = await subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode("PesaPilot backup v5") }, hk, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
const exportPub = async k => b64(new Uint8Array(await subtle.exportKey("raw", k)));
const importPub = s => subtle.importKey("raw", unb64(s), CURVE, true, []);

/** Switch protection on. The private key exists in memory only, then only inside the two locks. */
async function setUp(password) {
  const pair = await subtle.generateKey(CURVE, true, ["deriveBits"]);
  const code = newRecoveryCode();
  const phone = { keyId: b64(rnd(8)), publicKey: await exportPub(pair.publicKey),
    passwordLock: await lockPrivate(pair.privateKey, password), codeLock: await lockPrivate(pair.privateKey, normaliseCode(code)) };
  return { phone, code };
}

/** One-tap backup: uses only what the phone stores (public key + locks). Needs no password. */
async function backup(phone, records) {
  const oneTime = await subtle.generateKey(CURVE, true, ["deriveBits"]);       // made for this backup, then discarded
  const header = { app: "PesaPilot", backupVersion: 5, encrypted: true, scheme: "ECDH-P256+HKDF-SHA256+AES-GCM-256", kdf: { alg: "PBKDF2-SHA-256", rounds: ROUNDS },
    keyId: phone.keyId, publicKey: phone.publicKey, oneTimePublicKey: await exportPub(oneTime.publicKey), salt: b64(rnd(16)), iv: b64(rnd(12)),
    passwordLock: phone.passwordLock, codeLock: phone.codeLock };
  const key = await fileKey(oneTime.privateKey, await importPub(phone.publicKey), unb64(header.salt));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv: unb64(header.iv), additionalData: enc.encode(JSON.stringify(header)) }, key, enc.encode(JSON.stringify(records)));
  return JSON.stringify({ ...header, payload: b64(new Uint8Array(ct)) });
}

/** Open with { password } or { code }: unlock the private key, rebuild this file's key, decrypt. */
async function open(fileText, { password, code }) {
  const f = JSON.parse(fileText), { payload, ...header } = f;
  const priv = await unlockPrivate(password !== undefined ? f.passwordLock : f.codeLock, password !== undefined ? password : normaliseCode(code));
  const key = await fileKey(priv, await importPub(header.oneTimePublicKey), unb64(header.salt));
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: unb64(header.iv), additionalData: enc.encode(JSON.stringify(header)) }, key, unb64(payload));
  return { records: JSON.parse(dec.decode(pt)), priv, header };
}

/** Change password: needs the current password or the code (the phone holds no usable private key). */
async function changePassword(phone, { oldPassword, code }, newPassword) {
  const priv = await unlockPrivate(oldPassword !== undefined ? phone.passwordLock : phone.codeLock, oldPassword !== undefined ? oldPassword : normaliseCode(code));
  return { ...phone, passwordLock: await lockPrivate(priv, newPassword) };
}

/** Restore onto a (new) phone with the password or the code, then set a new password. Same key pair, same code. */
async function restoreOntoPhone(fileText, secret, newPassword) {
  const { records, priv, header } = await open(fileText, secret);
  return { records, phone: { keyId: header.keyId, publicKey: header.publicKey, passwordLock: await lockPrivate(priv, newPassword), codeLock: header.codeLock } };
}

module.exports = { setUp, backup, open, changePassword, restoreOntoPhone, newRecoveryCode, normaliseCode };

if (require.main === module) {
  const assert = require("assert");
  const fails = async p => { try { await p; return false; } catch { return true; } };
  (async () => {
    const records = { schemaVersion: 10, transactions: [{ id: 1, type: "expense", amount: 450, category: "Food" }] };
    const PW = "chungwa basi kumi mlango", PW2 = "taa ndege sufuria mwezi";
    const { phone, code } = await setUp(PW);
    const file1 = await backup(phone, records);

    // Q1 password opens the backup
    assert.deepEqual((await open(file1, { password: PW })).records, records);
    // Q2 the recovery code opens the SAME backup (lower case, no dashes also accepted)
    assert.deepEqual((await open(file1, { code: code.toLowerCase().replace(/-/g, "") })).records, records);
    assert.ok(await fails(open(file1, { password: "wrong password here" })));
    // Q3 what the phone stores: a PUBLIC key + two locked copies of the private key + an id. Nothing that decrypts.
    assert.deepEqual(Object.keys(phone).sort(), ["codeLock", "keyId", "passwordLock", "publicKey"]);
    assert.ok(!JSON.stringify(phone).includes(PW) && !JSON.stringify(phone).includes(code));
    // Q4 NEW PROPERTY: with only what the phone stores (and no secret), no backup can be opened.
    //    The public key cannot derive any file key: ECDH needs a private key, and the phone has none in usable form.
    const f = JSON.parse(file1);
    assert.ok(await fails((async () => {
      const pub = await importPub(phone.publicKey), oneTimePub = await importPub(f.oneTimePublicKey);
      await subtle.deriveBits({ name: "ECDH", public: oneTimePub }, pub, 256);   // the only material available: public keys
    })()));
    // The file never contains the password, the code or an unlocked private key
    assert.ok(!file1.includes(PW) && !file1.includes(code));
    // Q5 change password (needs the old password OR the code)
    assert.ok(await fails(changePassword(phone, { oldPassword: "not my password" }, PW2)));
    const phone2 = await changePassword(phone, { oldPassword: PW }, PW2);
    const file2 = await backup(phone2, records);
    assert.ok(await open(file2, { password: PW2 }));
    assert.ok(await fails(open(file2, { password: PW })));
    assert.ok(await open(file2, { code }));
    assert.ok(await open(file1, { password: PW }));          // OLD file: still the OLD password
    assert.ok(await fails(open(file1, { password: PW2 })));  // OLD file: new password does not work
    assert.ok(await open(file1, { code }));                  // OLD file: code still works
    const phone3 = await changePassword(phone2, { code }, PW); // forgot password, phone fine → reset with the code
    assert.ok(await open(await backup(phone3, records), { password: PW }));
    // Q6 replacement phone with ONLY the recovery code
    const { records: r6, phone: newPhone } = await restoreOntoPhone(file1, { code }, "kiti samaki wingu saba");
    assert.deepEqual(r6, records);
    const file6 = await backup(newPhone, records);
    assert.ok(await open(file6, { password: "kiti samaki wingu saba" }));
    assert.ok(await open(file6, { code }));
    // Q7 phone lost, file + code kept: restore works (Q6); a wrong code fails; any edit fails
    assert.ok(await fails(open(file1, { code: newRecoveryCode() })));
    const t1 = JSON.parse(file1); t1.backupVersion = 4; assert.ok(await fails(open(JSON.stringify(t1), { password: PW })));
    const t2 = JSON.parse(file1); const p = unb64(t2.payload); p[5] ^= 1; t2.payload = b64(p); assert.ok(await fails(open(JSON.stringify(t2), { password: PW })));
    const t3 = JSON.parse(file1); t3.oneTimePublicKey = (JSON.parse(file2)).oneTimePublicKey; assert.ok(await fails(open(JSON.stringify(t3), { password: PW })));
    // Every backup uses a fresh one-time key, so two backups never share a file key
    assert.notEqual(JSON.parse(file1).oneTimePublicKey, JSON.parse(await backup(phone, records)).oneTimePublicKey);
    assert.match(code, /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    console.log("Example recovery code:", code);
    console.log("All DB-4 key-architecture checks pass (Q1–Q7 + 'the phone alone cannot open any backup').");
  })().catch(e => { console.error(e); process.exit(1); });
}
