// The automation credential grants import access only, never account/admin access.
export async function machineAuthorized(req, secret, expectedVersion) {
 if(typeof secret!=='string'||secret.length<32||!expectedVersion)return false;
 if(req.headers.get('X-Ruumr-Import-Target')!==expectedVersion)return false;
 const supplied=req.headers.get('X-Ruumr-Import-Key')||'';
 if(supplied.length>256||supplied.length<32)return false;
 const digest=async value=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 const [a,b]=await Promise.all([digest(secret),digest(supplied)]);
 let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a[i]^b[i];
 return mismatch===0;
}