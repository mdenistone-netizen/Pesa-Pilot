// Plays the part of ANY same-origin code (a worker here; the page itself or an injected script would be the same).
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
function db(){return new Promise((res,rej)=>{const r=indexedDB.open("pp-keys",1);r.onupgradeneeded=()=>r.result.createObjectStore("k");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function get(k){const d=await db();return new Promise(r=>{const q=d.transaction("k").objectStore("k").get(k);q.onsuccess=()=>r(q.result);});}
self.addEventListener("message",async e=>{
  const out={};
  // Design A (round 2): non-extractable AES data key on the phone.
  const dk=await get("dk"), sample=await get("sample");
  out.A_keyRetrieved=!!dk; out.A_extractable=dk&&dk.extractable;
  try{await crypto.subtle.exportKey("raw",dk); out.A_export="EXPORTED";}catch{out.A_export="blocked";}
  try{const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:sample.iv},dk,sample.ct); out.A_decryptBackup=new TextDecoder().decode(pt);}catch(err){out.A_decryptBackup="failed";}
  // Design B (proposed): phone holds only a PUBLIC key.
  const pub=await get("pub"), sampleB=await get("sampleB");
  out.B_keyRetrieved=!!pub; out.B_keyType=pub&&pub.type;
  // To decrypt, ECDH needs the PRIVATE key matching pub, or the ephemeral private key. Neither is on the phone.
  try{ await crypto.subtle.deriveBits({name:"ECDH",public:sampleB.ephPub},pub,256); out.B_decrypt="DERIVED (bad)"; }catch{ out.B_decrypt="impossible: a public key cannot derive the secret"; }
  // It CAN still make a new backup (encrypt) with a fresh ephemeral key:
  const eph=await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"ECDH",public:pub},eph.privateKey,256); out.B_canEncryptNew=bits.byteLength===32;
  e.source.postMessage(out);
});
