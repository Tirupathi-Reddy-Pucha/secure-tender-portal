import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from './Layout';

const MyBids = () => {
    const navigate = useNavigate();
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBids = async () => {
            try {
                const res = await api.get('/bids');
                setBids(res.data);
            } catch (err) {
                console.error("Failed to fetch bids", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBids();
    }, []);

    return (
        <Layout>
            <button
                onClick={() => navigate('/contractor')}
                className="glass-btn"
                style={{
                    marginBottom: '1rem',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'fit-content'
                }}
            >
                ← Back to Dashboard
            </button>
            <h2 style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>MY SUBMITTED BIDS</h2>

            {loading ? (
                <div style={{ color: 'white', textAlign: 'center' }}>Loading...</div>
            ) : bids.length === 0 ? (
                <div style={{ color: '#94a3b8', textAlign: 'center' }}>No bids submitted yet.</div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Amount ($)</th>
                            <th>Status</th>
                            <th>Submitted At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bids.map(bid => (
                            <tr key={bid._id}>
                                <td>{bid.projectId}</td>
                                <td>${bid.amount}</td> {/* Contractors can see their own amount */}
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.8rem',
                                        background: bid.status === 'sealed' ? 'var(--primary)' : 'var(--success)',
                                        color: 'black'
                                    }}>
                                        {bid.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>{new Date(bid.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Layout>
    );
};

export default MyBids;
