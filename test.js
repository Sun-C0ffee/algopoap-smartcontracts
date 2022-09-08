const algosdk = require('algosdk');
console.log(algosdk.decodeUint64(Buffer.from(`AAAAAAAAAJY=`, "base64")))
console.log(algosdk.decodeUint64(Buffer.from(`AAAAAAAAAAA=`, "base64")))
console.log(algosdk.decodeUint64(Buffer.from(`AAAAAAAAAAs=`, "base64")))
