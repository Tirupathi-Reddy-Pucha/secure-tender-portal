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
            const supportingDocument = reader.result; // Base64 String

            try {
                await api.post('/bids', {
                    projectId,
                    amount,
                    supportingDocument
                });
                setMessage({ type: 'success', text: 'Bid Submitted & Encrypted Successfully' });
                setProjectId('');
                setAmount('');
                setFile(null);
            } catch (err) {
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

                            console.log('Tender:', t.title);
                            console.log('WinnerObj:', t.winner);
                            console.log('WinnerContractor:', winnerContractor);
                            console.log('WinnerID:', winnerId);
                            console.log('UserID:', user?.userId);
                            console.log('IsWinner:', isWinner);

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
