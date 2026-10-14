// Password-protected export only. Active browser/SQLite records are not encrypted.
export const ENCRYPTED_BACKUP_FORMAT='longhand-encrypted-backup';
export const BACKUP_KDF_ITERATIONS=600000;
export const BACKUP_PLAINTEXT_LIMIT=100000000;
export const BACKUP_FILE_LIMIT=134000000;
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===[...keys].sort().join(',');
function available(){if(!globalThis.crypto?.subtle||!crypto.getRandomValues)throw Error('Encrypted backups need Web Crypto on HTTPS or localhost.');}
export function checkBackupPassword(password){if(typeof password!=='string'||[...password].length<12||encoder.encode(password).length>1024||!password.trim())throw Error('Use a password of at least 12 characters, up to 1024 UTF-8 bytes. A long unique passphrase is recommended.');return password;}
function toBase64(bytes){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);}
function fromBase64(s,max){if(typeof s!=='string'||s.length>4*Math.ceil(max/3)||s.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('Invalid encrypted backup encoding.');const raw=atob(s);if(raw.length>max)throw Error('Encrypted backup exceeds its supported size.');const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));if(toBase64(bytes)!==s)throw Error('Noncanonical encrypted backup encoding.');return bytes;}
const header=e=>({format:e.format,version:e.version,createdAt:e.createdAt,cipher:e.cipher,kdf:e.kdf,salt:e.salt,iv:e.iv});
export function validateEncryptedBackup(e){
 if(!exact(e,['format','version','createdAt','cipher','kdf','salt','iv','ciphertext'])||e.format!==ENCRYPTED_BACKUP_FORMAT||e.version!==1||typeof e.createdAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.createdAt)||!Number.isFinite(Date.parse(e.createdAt))||new Date(e.createdAt).toISOString()!==e.createdAt||e.cipher!=='AES-256-GCM'||!exact(e.kdf,['name','hash','iterations'])||e.kdf.name!=='PBKDF2'||e.kdf.hash!=='SHA-256'||e.kdf.iterations!==BACKUP_KDF_ITERATIONS)throw Error('Unsupported encrypted backup format or encryption settings.');
 const salt=fromBase64(e.salt,16),iv=fromBase64(e.iv,12),ciphertext=fromBase64(e.ciphertext,BACKUP_PLAINTEXT_LIMIT+16);if(salt.length!==16||iv.length!==12||ciphertext.length<17)throw Error('Incomplete encrypted backup.');return {salt,iv,ciphertext};
}
async function key(password,salt){const bytes=encoder.encode(checkBackupPassword(password));try{const material=await crypto.subtle.importKey('raw',bytes,'PBKDF2',false,['deriveKey']);return await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:BACKUP_KDF_ITERATIONS},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}finally{bytes.fill(0);}}
export async function encryptBackup(bundle,password){
 available();checkBackupPassword(password);if(bundle?.format!=='longhand-complete-backup'||bundle.version!==1)throw Error('Encrypt a supported complete Office backup.');const plain=encoder.encode(JSON.stringify(bundle));if(plain.length>BACKUP_PLAINTEXT_LIMIT){plain.fill(0);throw Error('Complete backup exceeds 100 MB.');}
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),e={format:ENCRYPTED_BACKUP_FORMAT,version:1,createdAt:new Date().toISOString(),cipher:'AES-256-GCM',kdf:{name:'PBKDF2',hash:'SHA-256',iterations:BACKUP_KDF_ITERATIONS},salt:toBase64(salt),iv:toBase64(iv)};
 try{const k=await key(password,salt),encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(JSON.stringify(header(e))),tagLength:128},k,plain);return {...e,ciphertext:toBase64(new Uint8Array(encrypted))};}finally{plain.fill(0);}
}
export async function decryptBackup(envelope,password){
 available();const {salt,iv,ciphertext}=validateEncryptedBackup(envelope);const k=await key(password,salt);let plain;
 try{plain=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode(JSON.stringify(header(envelope))),tagLength:128},k,ciphertext));}catch{throw Error('Could not unlock this backup. Check the password; the file may also be damaged or changed.');}
 try{if(plain.length>BACKUP_PLAINTEXT_LIMIT)throw Error('Decrypted backup exceeds 100 MB.');const bundle=JSON.parse(decoder.decode(plain));if(bundle?.format!=='longhand-complete-backup'||bundle.version!==1)throw Error('Decrypted file is not a supported complete Office backup.');return bundle;}finally{plain.fill(0);}
}
