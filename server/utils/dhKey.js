const crypto = require('crypto');

// Generate a global DH group for the server lifetime
// Using 1024-bit prime for demo speed (use 2048+ for production)
const serverDH = crypto.createDiffieHellman(1024);
const serverKeys = serverDH.generateKeys();

module.exports = {
    serverDH,
    getPublicKey: () => serverKeys.toString('base64'),
    getPrime: () => serverDH.getPrime().toString('base64'),
    getGenerator: () => serverDH.getGenerator().toString('base64'),
    computeSecret: (clientPublicKeyBase64) => {
        const clientPublicKey = Buffer.from(clientPublicKeyBase64, 'base64');
        return serverDH.computeSecret(clientPublicKey);
    }
};
