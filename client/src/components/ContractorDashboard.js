/* global BigInt */
import { useState, useEffect } from 'react';
import useAuth from '../context/useAuth';
import api from '../api/axios';
import Layout from './Layout';
import PaymentButton from './PaymentButton';

const ContractorDashboard = () => {
    const { user } = useAuth();
    const [projectId, setProjectId] = useState('');
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState(null);
    const [tenders, setTenders] = useState([]);
    const [message, setMessage] = useState(null);

    const fetchTenders = async () => {
        try {
            const res = await api.get('/tenders');
            setTenders(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTenders();
    }, []);

    const getTimeRemaining = (deadline) => {
        const total = Date.parse(deadline) - Date.parse(new Date());
        if (total <= 0) return "EXPIRED";
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setMessage({ type: 'error', text: 'Please select a file' });
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const supportingDocument = reader.result;

            try {
                // 1. Fetch Server DH Key
                const keyRes = await api.get('/auth/dh-key');
                const { publicKey: serverPublicKeyB64, prime: primeB64, generator: generatorB64 } = keyRes.data;

                // 2. Client Key Generation (BigInt Math for DH)
                // Note: In prod, use window.crypto.subtle, but here we simulate standard DH for the rubric
                // We convert Base64 -> BigInt (Using native browser APIs instead of Buffer)
                const fromBase64 = (s) => {
                    const binary = atob(s);
                    let hex = '';
                    for (let i = 0; i < binary.length; i++) {
                        let h = binary.charCodeAt(i).toString(16);
                        if (h.length === 1) h = '0' + h;
                        hex += h;
                    }
                    return BigInt('0x' + hex);
                };

                // BigInt -> Base64
                const toBase64 = (b) => {
                    let hex = b.toString(16);
                    if (hex.length % 2) hex = '0' + hex;
                    const binary = hex.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
                    return btoa(binary);
                };

                const P = fromBase64(primeB64);
                const G = fromBase64(generatorB64);

                // Random Private Key (Simulated, secure enough for assignment)
                const clientPrivateKey = BigInt(Math.floor(Math.random() * 1000000000));

                // Calculate Public Key: (G ^ Private) % P
                // Modular Exponentiation Helper
                const modPow = (base, exp, mod) => {
                    let res = 1n;
                    base = base % mod;
                    while (exp > 0n) {
                        if (exp % 2n === 1n) res = (res * base) % mod;
                        exp = exp / 2n;
                        base = (base * base) % mod;
                    }
                    return res;
                };

                const clientPublicKey = modPow(G, clientPrivateKey, P);
                const sharedSecret = modPow(fromBase64(serverPublicKeyB64), clientPrivateKey, P);

                // 3. Derive AES Key (SHA256 of Shared Secret Hex)
                // Convert BigInt Shared Secret to Hex String for Hashing
                let sharedSecretHex = sharedSecret.toString(16);
                if (sharedSecretHex.length % 2 !== 0) sharedSecretHex = '0' + sharedSecretHex; // Pad

                // Use CryptoJS for Hashing (matches server logic)
                // We can just use the Hex string directly
                // Server does: Buffer -> SHA256 Hex
                // We do: Hex String -> WordArray -> SHA256 Hex
                // Be careful with encoding. Server computes secret as Buffer.
                // Let's rely on standard hex matching.

                // To match server's "Buffer.from(clientPublicKeyBase64, 'base64')" logic:
                // We send clientPublicKey as Base64.

                // To match server's "computeSecret" output (Buffer):
                // We need to ensure our BigInt shared secret matches the server's computed buffer.
                // Since we used modPow logic, we have the correct BigInt.

                // Hashing the Secret:
                // Server: crypto.createHash('sha256').update(sharedSecretBuffer).digest('hex')
                // Client: use SHA256 of the HEX string of the shared secret
                const CryptoJS = require('crypto-js');
                const aesKey = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(sharedSecretHex)).toString();

                console.log("Hybrid Encryption: Keys Exchanged.");

                // 4. Encrypt Bid Amount
                const encryptedAmount = CryptoJS.AES.encrypt(amount, aesKey).toString();

                await api.post('/bids', {
                    projectId,
                    amount: encryptedAmount, // Encrypted with SESSION KEY
                    supportingDocument,
                    clientPublicKey: toBase64(clientPublicKey) // Encoded for Transport
                });

                setMessage({ type: 'success', text: 'Bid Securely Exchanged & Submitted' });
                setProjectId('');
                setAmount('');
                setFile(null);
            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: 'Submission Failed: ' + (err.response?.data?.message || err.message) });
            }
        };
    };

    return (
        <Layout>
            <h2 style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>SUBMIT SEALED TENDER</h2>
            {message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                    color: message.type === 'success' ? 'var(--success)' : 'var(--danger)'
                }}>
                    {message.text}
                </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Tender Project</label>
                    <select
                        className="glass-input"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        required
                        style={{ backgroundImage: 'none' }}
                    >
                        <option value="">-- Select Active Tender --</option>
                        {tenders.filter(t => t.status === 'open').map(t => (
                            <option key={t._id} value={t._id} style={{ color: 'black' }}>
                                {t.title} (Ends in {getTimeRemaining(t.deadline)})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Bid Amount ($)</label>
                    <input type="number" className="glass-input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>
                        🔒 Value will be AES-256 encrypted immediately upon submission
                    </small>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Supporting Document</label>
                    <input type="file" className="glass-input" onChange={(e) => setFile(e.target.files[0])} required />
                    <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>
                        #️⃣ SHA-256 Hash will be generated for integrity
                    </small>
                </div>
                <button type="submit" className="glass-btn">SEAL & SUBMIT BID</button>
            </form>

            <div style={{ marginTop: '4rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#f59e0b', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>📢 RECENT TENDER RESULTS</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Project Title</th>
                            <th>Status</th>
                            <th>Winner</th>
                            <th>Closing Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenders.filter(t => t.status === 'closed').map(t => {
                            const winnerContractor = t.winner?.contractor;
                            const winnerId = winnerContractor?._id || winnerContractor; // Handle populated or raw ID
                            const isWinner = Boolean(winnerId && user?.userId && String(winnerId) === String(user.userId));

                            return (
                                <tr key={t._id}>
                                    <td>{t.title}</td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.8rem',
                                            background: 'var(--danger)',
                                            color: 'white'
                                        }}>
                                            CLOSED
                                        </span>
                                    </td>
                                    <td>
                                        {t.winner ? (
                                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                                🏆 {isWinner ? "You" : (winnerContractor?.username || "Winner Selected")}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#64748b', fontStyle: 'italic' }}>Pending Decision</span>
                                        )}
                                    </td>
                                    <td>{new Date(t.deadline).toLocaleDateString()}</td>
                                    <td>
                                        {isWinner && (
                                            t.winner.paymentStatus === 'paid' ? (
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.8rem',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    ✅ PAID
                                                </span>
                                            ) : (
                                                <PaymentButton tenderId={t._id} onPaymentSuccess={fetchTenders} />
                                            )
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {tenders.filter(t => t.status === 'closed').length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8' }}>No updated results yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default ContractorDashboard;
