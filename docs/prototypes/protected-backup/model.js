// DB-4 reference model: protected backup key architecture.
// PLANNING ARTEFACT ONLY. Not part of the app, never loaded by index.html. Run: node model.js
// Uses the same Web Crypto API the browser provides (Node 22 exposes it as globalThis.crypto).
// Answers the owner's 7 questions with executable checks (see the bottom of the file).
"use strict";
const subtle = globalThis.crypto.subtle, rnd = n => globalThis.crypto.getRandomValues(new Uint8Array(n));
const b64 = u8 => Buffer.from(u8).toString("base64"), unb64 = s => new Uint8Array(Buffer.from(s, "base64"));
const enc = new TextEncoder(), dec = new TextDecoder();
const ROUNDS = 600000;

// Recovery code: 16 characters from Crockford's base32 (no I, L, O, U) = 80 bits, shown as XXXX-XXXX-XXXX-XXXX.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function newRecoveryCode() { const b = rnd(16); let s = ""; for (const x of b) s += ALPHABET[x & 31]; return s.match(/.{4}/g).join("-"); }
// Typing help: case-insensitive, dashes/spaces ignored, O→0, I/L→1.
const normaliseCode = c => c.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");

// KEK = key-encryption key, derived from a secret (password or recovery code). It only ever locks/unlocks DK.
async function deriveKEK(secret, salt) {
  const base = await subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ROUNDS }, base, { name: "AES-GCM", length: 256 }, false, ["wrapKey", "unwrapKey"]);
}
async function lockDK(dk, secret) { // returns a "lock" record: salt + iv + DK encrypted under the KEK
  const salt = rnd(16), iv = rnd(12), kek = await deriveKEK(secret, salt);
  return { salt: b64(salt), iv: b64(iv), wrapped: b64(new Uint8Array(await subtle.wrapKey("raw", dk, kek, { name: "AES-GCM", iv }))) };
}
async function unlockDK(lock, secret, extractable) {
  const kek = await deriveKEK(secret, unb64(lock.salt));
  return subtle.unwrapKey("raw", unb64(lock.wrapped), kek, { name: "AES-GCM", iv: unb64(lock.iv) }, { name: "AES-GCM", length: 256 }, extractable, ["encrypt", "decrypt"]);
}
// The phone keeps a NON-extractable copy of DK (stored in IndexedDB in the browser; see the brief).
async function nonExtractable(dk) { return subtle.importKey("raw", await subtle.exportKey("raw", dk), "AES-GCM", false, ["encrypt", "decrypt"]); }

/** Switch protection on. Returns what the phone stores, and the recovery code to show ONCE. */
async function setUp(password) {
  const dk = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]); // exists in memory only
  const code = newRecoveryCode();
  const phone = { keyId: b64(rnd(8)), dk: await nonExtractable(dk), passwordLock: await lockDK(dk, password), codeLock: await lockDK(dk, normaliseCode(code)) };
  return { phone, code }; // the extractable dk goes out of scope here
}

/** One-tap backup: needs no password; uses the phone's non-extractable DK and copies both locks into the file. */
async function backup(phone, records) {
  const header = { app: "PesaPilot", backupVersion: 5, encrypted: true, cipher: "AES-GCM-256", kdf: { alg: "PBKDF2-SHA-256", rounds: ROUNDS },
    keyId: phone.keyId, passwordLock: phone.passwordLock, codeLock: phone.codeLock, iv: b64(rnd(12)) };
  const aad = enc.encode(JSON.stringify(header)); // the whole header is authenticated: editing any part makes the file fail to open
  const ct = await subtle.encrypt({ name: "AES-GCM", iv: unb64(header.iv), additionalData: aad }, phone.dk, enc.encode(JSON.stringify(records)));
  return JSON.stringify({ ...header, payload: b64(new Uint8Array(ct)) });
}

/** Open a protected file with { password } or { code }. Returns the records and an extractable DK (memory only, for restore). */
async function open(fileText, { password, code }) {
  const f = JSON.parse(fileText), { payload, ...header } = f;
  const dk = await unlockDK(password !== undefined ? f.passwordLock : f.codeLock, password !== undefined ? password : normaliseCode(code), true);
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: unb64(header.iv), additionalData: enc.encode(JSON.stringify(header)) }, dk, unb64(payload));
  return { records: JSON.parse(dec.decode(pt)), dk, header };
}

/** Change the password: needs the CURRENT password or the recovery code (the phone's DK cannot be exported to re-lock it). */
async function changePassword(phone, { oldPassword, code }, newPassword) {
  const dk = await unlockDK(oldPassword !== undefined ? phone.passwordLock : phone.codeLock, oldPassword !== undefined ? oldPassword : normaliseCode(code), true);
  return { ...phone, passwordLock: await lockDK(dk, newPassword) }; // same DK, same recovery-code lock
}

/** Restore onto a (new) phone, then adopt the same DK so the same recovery code keeps working; set a password. */
async function restoreOntoPhone(fileText, secret, newPassword) {
  const { records, dk, header } = await open(fileText, secret);
  const phone = { keyId: header.keyId, dk: await nonExtractable(dk), passwordLock: await lockDK(dk, newPassword), codeLock: header.codeLock };
  return { records, phone };
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
    // Q2 the recovery code opens the SAME backup (also typed in lower case without dashes)
    assert.deepEqual((await open(file1, { code: code.toLowerCase().replace(/-/g, "") })).records, records);
    assert.ok(await fails(open(file1, { password: "wrong password here" })));
    // Q3/Q4 what the phone stores: a non-extractable DK + the two locks. No password, no code.
    assert.deepEqual(Object.keys(phone).sort(), ["codeLock", "dk", "keyId", "passwordLock"]);
    assert.equal(phone.dk.extractable, false);
    assert.ok(await fails(globalThis.crypto.subtle.exportKey("raw", phone.dk)));
    assert.ok(!JSON.stringify({ ...phone, dk: undefined }).includes(PW) && !JSON.stringify(phone).includes(code));
    // The file never contains DK in readable form, the password or the code
    assert.ok(!file1.includes(PW) && !file1.includes(code));
    // Q5 change password (needs the old password OR the code)
    assert.ok(await fails(changePassword(phone, { oldPassword: "not my password" }, PW2)));
    const phone2 = await changePassword(phone, { oldPassword: PW }, PW2);
    const file2 = await backup(phone2, records);
    assert.ok(await open(file2, { password: PW2 }));                  // new file: new password
    assert.ok(await fails(open(file2, { password: PW })));           // new file: old password no longer works
    assert.ok(await open(file2, { code }));                          // new file: same recovery code
    assert.ok(await open(file1, { password: PW }));                   // OLD file: still the OLD password
    assert.ok(await fails(open(file1, { password: PW2 })));          // OLD file: new password does NOT work
    assert.ok(await open(file1, { code }));                          // OLD file: recovery code still works
    //    forgot password, phone fine → reset it with the recovery code
    const phone3 = await changePassword(phone2, { code }, PW);
    assert.ok(await open(await backup(phone3, records), { password: PW }));
    // Q6 replacement phone with ONLY the recovery code
    const { records: r6, phone: newPhone } = await restoreOntoPhone(file1, { code }, "kiti samaki wingu saba");
    assert.deepEqual(r6, records);
    const file6 = await backup(newPhone, records);
    assert.ok(await open(file6, { password: "kiti samaki wingu saba" }));
    assert.ok(await open(file6, { code }));                          // the same paper code keeps working
    // Q7 phone lost, file + code kept: restore works (as Q6); a wrong code fails; tampering fails
    assert.ok(await fails(open(file1, { code: newRecoveryCode() })));
    const t1 = JSON.parse(file1); t1.backupVersion = 4; assert.ok(await fails(open(JSON.stringify(t1), { password: PW })));  // header edited
    const t2 = JSON.parse(file1); const p = unb64(t2.payload); p[5] ^= 1; t2.payload = b64(p);
    assert.ok(await fails(open(JSON.stringify(t2), { password: PW })));                                                         // content edited
    // Recovery code shape: 16 characters, 80 bits, no look-alikes
    assert.match(code, /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    console.log("Example recovery code:", code);
    console.log("All DB-4 key-architecture checks pass (Q1–Q7).");
  })().catch(e => { console.error(e); process.exit(1); });
}
