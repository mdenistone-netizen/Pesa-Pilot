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
// What is authenticated together with the records (AES-GCM associated data): everything in the header EXCEPT the
// two locks. Each lock is already authenticated on its own (AES-GCM key wrap), and a swapped lock can only unlock
// a different private key, which cannot rebuild this file's key. So one damaged lock leaves the other usable.
const aadOf = header => { const { passwordLock, codeLock, ...rest } = header; return enc.encode(JSON.stringify(rest)); };
const exportPub = async k => b64(new Uint8Array(await subtle.exportKey("raw", k)));
const importPub = s => subtle.importKey("raw", unb64(s), CURVE, true, []);

// ---- Integrity of what the phone stores (revision 3, 26 Nov) ----
// check = SHA-256 over the stored items. Detects ACCIDENTAL damage (storage corruption, a half-written update)
// before a one-tap backup. It cannot detect a DELIBERATE replacement by code that recomputes it; that is caught
// by verifyProtection (needs the password or code), run at setup, after a password change or restore, and in the
// monthly "do you remember your password?" check.
const stored = p => JSON.stringify({ keyId: p.keyId, publicKey: p.publicKey, passwordLock: p.passwordLock, codeLock: p.codeLock });
const sha = async t => b64(new Uint8Array(await subtle.digest("SHA-256", enc.encode(t))));
const seal = async p => ({ ...p, check: await sha(stored(p)) });
async function assertIntact(phone) {
  if (!phone || !phone.publicKey || !phone.passwordLock || !phone.codeLock) throw new Error("PROTECTION_MISSING");
  if (phone.check !== await sha(stored(phone))) throw new Error("PROTECTION_DAMAGED");
}
/** Unlock the private key with the user's secret and confirm it belongs to the stored public key. */
async function verifyProtection(phone, { password, code }) {
  await assertIntact(phone);
  const priv = await unlockPrivate(password !== undefined ? phone.passwordLock : phone.codeLock, password !== undefined ? password : normaliseCode(code));
  const jwk = await subtle.exportKey("jwk", priv);
  const fromPrivate = b64(new Uint8Array([4, ...Buffer.from(jwk.x, "base64url"), ...Buffer.from(jwk.y, "base64url")]));
  if (fromPrivate !== phone.publicKey) throw new Error("PROTECTION_MISMATCH");
  return true;
}

/** Switch protection on. The private key exists in memory only, then only inside the two locks.
 *  The setup is verified straight away (public key ↔ locked private key), before the user is told it worked. */
async function setUp(password) {
  const pair = await subtle.generateKey(CURVE, true, ["deriveBits"]);
  const code = newRecoveryCode();
  const phone = await seal({ keyId: b64(rnd(8)), publicKey: await exportPub(pair.publicKey),
    passwordLock: await lockPrivate(pair.privateKey, password), codeLock: await lockPrivate(pair.privateKey, normaliseCode(code)) });
  await verifyProtection(phone, { password });
  await verifyProtection(phone, { code });
  return { phone, code };
}

/** One-tap backup: uses only what the phone stores (public key + locks). Needs no password. */
async function backup(phone, records) {
  await assertIntact(phone);                                                  // refuse to write a backup nobody could open
  const oneTime = await subtle.generateKey(CURVE, true, ["deriveBits"]);       // made for this backup, then discarded
  const header = { app: "PesaPilot", backupVersion: 5, encrypted: true, scheme: "ECDH-P256+HKDF-SHA256+AES-GCM-256", kdf: { alg: "PBKDF2-SHA-256", rounds: ROUNDS },
    keyId: phone.keyId, publicKey: phone.publicKey, oneTimePublicKey: await exportPub(oneTime.publicKey), salt: b64(rnd(16)), iv: b64(rnd(12)),
    passwordLock: phone.passwordLock, codeLock: phone.codeLock };
  const key = await fileKey(oneTime.privateKey, await importPub(phone.publicKey), unb64(header.salt));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv: unb64(header.iv), additionalData: aadOf(header) }, key, enc.encode(JSON.stringify(records)));
  return JSON.stringify({ ...header, payload: b64(new Uint8Array(ct)) });
}

/** Open with { password } or { code }: unlock the private key, rebuild this file's key, decrypt. */
async function open(fileText, { password, code }) {
  const f = JSON.parse(fileText), { payload, ...header } = f;
  const priv = await unlockPrivate(password !== undefined ? f.passwordLock : f.codeLock, password !== undefined ? password : normaliseCode(code));
  const key = await fileKey(priv, await importPub(header.oneTimePublicKey), unb64(header.salt));
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: unb64(header.iv), additionalData: aadOf(header) }, key, unb64(payload));
  return { records: JSON.parse(dec.decode(pt)), priv, header };
}

/** Change password: needs the current password or the code (the phone holds no usable private key). */
async function changePassword(phone, { oldPassword, code }, newPassword) {
  const priv = await unlockPrivate(oldPassword !== undefined ? phone.passwordLock : phone.codeLock, oldPassword !== undefined ? oldPassword : normaliseCode(code));
  const next = await seal({ ...phone, passwordLock: await lockPrivate(priv, newPassword) });
  await verifyProtection(next, { password: newPassword });
  return next;
}

/** Restore onto a (new) phone with the password or the code, then set a new password. Same key pair, same code. */
async function restoreOntoPhone(fileText, secret, newPassword) {
  const { records, priv, header } = await open(fileText, secret);
  const phone = await seal({ keyId: header.keyId, publicKey: header.publicKey, passwordLock: await lockPrivate(priv, newPassword), codeLock: header.codeLock });
  await verifyProtection(phone, { password: newPassword });
  return { records, phone };
}

/** Repair damaged or missing phone items from ANY earlier backup file, after the user proves the password or code.
 *  The private key is re-locked with the password the user sets NOW (an old file carries an old password lock).
 *  The records on the phone are not touched; the same key pair and the same recovery code keep working. */
async function repairFromFile(fileText, secret, passwordNow) {
  const { header, priv } = await open(fileText, secret);                      // proves the secret opens this file
  const phone = await seal({ keyId: header.keyId, publicKey: header.publicKey, passwordLock: await lockPrivate(priv, passwordNow), codeLock: header.codeLock });
  await verifyProtection(phone, { password: passwordNow });
  return phone;
}

module.exports = { setUp, backup, open, changePassword, restoreOntoPhone, repairFromFile, verifyProtection, newRecoveryCode, normaliseCode };

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
    assert.deepEqual(Object.keys(phone).sort(), ["check", "codeLock", "keyId", "passwordLock", "publicKey"]);
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

    // ================= Full lifecycle (owner, 26 Nov) =================
    const L = console.log, rec = n => ({ schemaVersion: 10, note: `backup ${n}`, transactions: [{ id: n, amount: 100 * n }] });
    const opens = async (file, secret) => { try { return (await open(file, secret)).records.note; } catch { return null; } };
    const A = "mvua kalamu tisa dirisha punda", B = "ndizi wingu saba barabara jiko", C = "kioo nyota simba mto keki";
    // L1 first-time setup + first backup (setup verifies itself before reporting success)
    const s1 = await setUp(A); let ph = s1.phone; const CODE = s1.code;
    const b1 = await backup(ph, rec(1));
    L("L1 setup verified; backup 1 opens with password:", await opens(b1, { password: A }));
    // L2 one-tap backups: backup() takes NO secret at all; it uses only the stored public key + locks
    assert.equal(backup.length, 2);
    const b2 = await backup(ph, rec(2)), b3 = await backup(ph, rec(3));
    L("L2 one-tap backups 2 and 3 made without any password");
    // L3 password change (needs the old password), then more backups
    ph = await changePassword(ph, { oldPassword: A }, B);
    const b4 = await backup(ph, rec(4)), b5 = await backup(ph, rec(5));
    // L4 phone lost → replacement phone restored with the RECOVERY CODE ONLY, from the newest backup; new password C
    const rp = await restoreOntoPhone(b5, { code: CODE }, C); assert.equal(rp.records.note, "backup 5");
    ph = rp.phone; const b6 = await backup(ph, rec(6));
    // L5 every backup, before and after the change and the new phone, with every secret
    const files = [b1, b2, b3, b4, b5, b6], table = [];
    for (const [i, f] of files.entries()) table.push({ backup: i + 1, passwordA: !!(await opens(f, { password: A })), passwordB: !!(await opens(f, { password: B })), passwordC: !!(await opens(f, { password: C })), recoveryCode: !!(await opens(f, { code: CODE })) });
    console.table(table);
    assert.deepEqual(table.map(r => [r.passwordA, r.passwordB, r.passwordC, r.recoveryCode]), [
      [true, false, false, true], [true, false, false, true], [true, false, false, true],     // made with password A
      [false, true, false, true], [false, true, false, true],                                 // after change to B
      [false, false, true, true]]);                                                           // replacement phone, C
    // L6 the phone alone cannot open even the backups it just made
    for (const f of files) {
      const h = JSON.parse(f);
      assert.ok(await fails(subtle.deriveBits({ name: "ECDH", public: await importPub(h.oneTimePublicKey) }, await importPub(ph.publicKey), 256)));
    }
    L("L6 none of the 6 backups can be opened with what the phone stores");
    // ---- Damage cases ----
    const flip = s => { const u = unb64(s); u[10] ^= 1; return b64(u); };
    // D-a public key corrupted on the phone → one-tap backup REFUSED (no unopenable file is written) → repaired from any old file
    const badPub = { ...ph, publicKey: flip(ph.publicKey) };
    assert.rejects ? null : null;
    let err = null; try { await backup(badPub, rec(7)); } catch (e) { err = e.message; } assert.equal(err, "PROTECTION_DAMAGED");
    const fixed1 = await repairFromFile(b2, { code: CODE }, C);         // an OLD file + the code; re-locked with the CURRENT password C
    const b7 = await backup(fixed1, rec(7));
    assert.equal(await opens(b7, { code: CODE }), "backup 7"); assert.equal(await opens(b7, { password: C }), "backup 7");
    assert.equal(await opens(b7, { password: A }), null);               // the old file's password does NOT come back
    L("D-a corrupted public key: backup refused (PROTECTION_DAMAGED); repaired from backup 2 + code; new backups open");
    // D-b phone items lost (storage cleared while records survive) → refused → repaired from a file with the password
    err = null; try { await backup({}, rec(8)); } catch (e) { err = e.message; } assert.equal(err, "PROTECTION_MISSING");
    const fixed2 = await repairFromFile(b6, { password: C }, C);
    assert.equal(await opens(await backup(fixed2, rec(8)), { password: C }), "backup 8");
    L("D-b missing items: backup refused (PROTECTION_MISSING); repaired from backup 6 + password");
    // D-c the locked private key corrupted on the phone → refused (would otherwise copy a broken lock into every new file)
    err = null; try { await backup({ ...ph, passwordLock: { ...ph.passwordLock, wrapped: flip(ph.passwordLock.wrapped) } }, rec(9)); } catch (e) { err = e.message; }
    assert.equal(err, "PROTECTION_DAMAGED");
    L("D-c corrupted password lock on the phone: backup refused (PROTECTION_DAMAGED)");
    // D-d a lock corrupted inside ONE backup file → the other lock still opens it; other files are unaffected
    const f4 = JSON.parse(b4); f4.passwordLock.wrapped = flip(f4.passwordLock.wrapped); const b4bad = JSON.stringify(f4);
    assert.equal(await opens(b4bad, { password: B }), null);           // the damaged password lock fails safely…
    assert.equal(await opens(b4bad, { code: CODE }), "backup 4");      // …the recovery code still opens the same file
    const f4b = JSON.parse(b4); f4b.passwordLock.wrapped = flip(f4b.passwordLock.wrapped); f4b.codeLock.wrapped = flip(f4b.codeLock.wrapped);
    assert.equal(await opens(JSON.stringify(f4b), { code: CODE }), null); // both locks damaged → this file is lost…
    assert.equal(await opens(b5, { password: B }), "backup 5");          // …but every other file still opens
    // A lock SWAPPED in from another key pair cannot open this file (it unlocks a different private key)
    const f4c = JSON.parse(b4); f4c.codeLock = JSON.parse(JSON.parse(JSON.stringify(await backup((await setUp("other person words here ok")).phone, rec(0))))).codeLock;
    assert.equal(await opens(JSON.stringify(f4c), { code: CODE }), null);
    // Editing anything else in the header still breaks the file
    const f4d = JSON.parse(b4); f4d.keyId = "AAAAAAAAAAA="; assert.equal(await opens(JSON.stringify(f4d), { code: CODE }), null);
    L("D-d damaged password lock in one file → the recovery code still opens it; both locks damaged → that file is lost, others open; swapped locks and other header edits are refused");
    // D-e a deliberate, CONSISTENT swap (public key + locks + recomputed check) by malicious same-origin code
    const evil = await setUp("attacker password words here");
    const swapped = { ...evil.phone };                                  // passes the integrity check
    await backup(swapped, rec(10));                                      // a one-tap backup silently uses the attacker's key…
    err = null; try { await verifyProtection(swapped, { password: C }); } catch (e) { err = e.message; }
    assert.ok(err);                                                      // …but the user's next password check FAILS → swap detected
    L(`D-e deliberate swap: integrity check passes (it can't catch this), but the next password check fails (${err}) → detected; backups made in between are locked to the attacker's key`);
    console.log("Example recovery code:", code);
    console.log("All DB-4 key-architecture checks pass (Q1–Q7 + 'the phone alone cannot open any backup').");
  })().catch(e => { console.error(e); process.exit(1); });
}
