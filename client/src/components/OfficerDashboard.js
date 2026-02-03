import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from './Layout';
import CreateTender from './CreateTender';

const OfficerDashboard = () => {
    const [bids, setBids] = useState([]);
    const [selectedBid, setSelectedBid] = useState(null);
    const [otp, setOtp] = useState('');
    const [unsealedData, setUnsealedData] = useState(null);
    const [tenders, setTenders] = useState([]);
    const [showAllBids, setShowAllBids] = useState(false);
    const [showAllActiveTenders, setShowAllActiveTenders] = useState(false);
    const [showAllPastTenders, setShowAllPastTenders] = useState(false);

    useEffect(() => {
        fetchBids();
        fetchTenders();
    }, []);

    const fetchTenders = async () => {
        try {
            const res = await api.get('/tenders');
            setTenders(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBids = async () => {
        try {
            const res = await api.get('/bids');
            // Sort bids by createdAt descending (newest first)
            const sortedBids = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setBids(sortedBids);
        } catch (err) {
            console.error(err);
        }
    };

    const [otpSent, setOtpSent] = useState(false);

    const handleRequestOtp = async () => {
        try {
            await api.post(`/bids/${selectedBid._id}/request-otp`);
            setOtpSent(true);
            alert('OTP Code logged to Server Console (Simulated SMS)');
        } catch (err) {
            console.error(err);
            alert('Failed to send OTP');
        }
    };

    const handleCloseTender = async (tenderId) => {
        if (!window.confirm('Are you sure you want to CLOSE this tender?')) return;
        try {
            await api.post(`/tenders/${tenderId}/close`);
            alert('Tender Closed Successfully!');
            fetchTenders();
        } catch (err) {
            alert('Failed to close tender');
        }
    };

    const handleReseal = async (bidId) => {
        if (!window.confirm('Are you sure you want to RESEAL this bid?')) return;
        try {
            await api.post(`/bids/${bidId}/reseal`);
            alert('Bid Resealed Successfully!');
            fetchBids();
        } catch (err) {
            console.error(err);
            alert('Failed to reseal bid');
        }
    };

    const handleUnseal = async () => {
        try {
            const res = await api.post(`/bids/${selectedBid._id}/unseal`, { otp });
            setUnsealedData(res.data);
            alert('Bid Unsealed Successfully!');
            fetchBids(); // Refresh status
        } catch (err) {
            alert('Unseal Failed! Check OTP.');
        }
    };

    // Derived state for tenders
    const activeTenders = tenders.filter(t => t.status === 'open').sort((a, b) => new Date(a.deadline) - new Date(b.deadline)); // Active: sooner deadline first
    const pastTenders = tenders.filter(t => t.status !== 'open').sort((a, b) => new Date(b.deadline) - new Date(a.deadline));   // Past: recent deadline first

    // Slice bids based on showAllBids state
    const visibleBids = showAllBids ? bids : bids.slice(0, 5);

    return (
        <Layout>
            <h2 style={{ marginBottom: '2rem' }}>TENDER OFFICER CONSOLE</h2>

            <CreateTender onTenderCreated={fetchTenders} />

            {/* ACTIVE TENDERS SECTION */}
            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#f59e0b' }}>ACTIVE TENDERS</h3>

            <div style={showAllActiveTenders ? { maxHeight: '400px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' } : {}}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: showAllActiveTenders ? 0 : '1rem' }}>
                    <thead style={showAllActiveTenders ? { position: 'sticky', top: 0, background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', zIndex: 1 } : {}}>
                        <tr>
                            <th>Title</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>Winner</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeTenders.slice(0, showAllActiveTenders ? activeTenders.length : 5).map(tender => (
                            <tr key={tender._id}>
                                <td>{tender.title}</td>
                                <td>{new Date(tender.deadline).toLocaleString()}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.8rem',
                                        background: 'var(--success)',
                                        color: 'black'
                                    }}>
                                        {tender.status.toUpperCase()}
                                    </span>
                                </td>
                                <td><span style={{ color: '#94a3b8' }}>-</span></td>
                                <td>
                                    <button
                                        onClick={() => handleCloseTender(tender._id)}
                                        className="glass-btn"
                                        style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'var(--danger)', color: 'white' }}
                                    >
                                        CLOSE
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {activeTenders.length > 5 && (
                <div style={{ marginTop: '0.5rem', marginBottom: '3rem', textAlign: 'center' }}>
                    <button
                        onClick={() => setShowAllActiveTenders(!showAllActiveTenders)}
                        className="glass-btn"
                        style={{ padding: '0.5rem 2rem' }}
                    >
                        {showAllActiveTenders ? 'VIEW LESS' : 'VIEW ALL'}
                    </button>
                </div>
            )}

            {/* PAST TENDERS SECTION */}
            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#94a3b8' }}>PAST TENDERS</h3>

            <div style={showAllPastTenders ? { maxHeight: '400px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' } : {}}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: showAllPastTenders ? 0 : '1rem' }}>
                    <thead style={showAllPastTenders ? { position: 'sticky', top: 0, background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', zIndex: 1 } : {}}>
                        <tr>
                            <th>Title</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>Winner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pastTenders.slice(0, showAllPastTenders ? pastTenders.length : 5).map(tender => (
                            <tr key={tender._id}>
                                <td>{tender.title}</td>
                                <td>{new Date(tender.deadline).toLocaleString()}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.8rem',
                                        background: 'var(--danger)',
                                        color: 'black'
                                    }}>
                                        {tender.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    {tender.winner ? (
                                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                                            🏆 {tender.winner.contractor?.username || 'Selected'}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#94a3b8' }}>-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pastTenders.length > 5 && (
                <div style={{ marginTop: '0.5rem', marginBottom: '3rem', textAlign: 'center' }}>
                    <button
                        onClick={() => setShowAllPastTenders(!showAllPastTenders)}
                        className="glass-btn"
                        style={{ padding: '0.5rem 2rem' }}
                    >
                        {showAllPastTenders ? 'VIEW LESS' : 'VIEW ALL'}
                    </button>
                </div>
            )}

            <h3 style={{ marginBottom: '1rem', color: '#f59e0b' }}>RECEIVED BIDS</h3>

            <div style={showAllBids ? { maxHeight: '400px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' } : {}}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={showAllBids ? { position: 'sticky', top: 0, background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', zIndex: 1 } : {}}>
                        <tr>
                            <th>Project ID</th>
                            <th>Contractor</th>
                            <th>Bid Amount (Encrypted)</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleBids.map(bid => (
                            <tr key={bid._id}>
                                <td>{bid.projectId}</td>
                                <td>{bid.contractor?.username}</td>
                                <td style={{ fontFamily: 'monospace', color: '#f59e0b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {bid.status === 'unsealed' ? '✅ DECRYPTED' : bid.encryptedAmount}
                                </td>
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
                                <td>
                                    {bid.status === 'sealed' && (
                                        <button
                                            onClick={() => { setSelectedBid(bid); setUnsealedData(null); setOtp(''); }}
                                            className="glass-btn"
                                            style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                                        >
                                            UNSEAL
                                        </button>
                                    )}
                                    {bid.status === 'unsealed' && (
                                        <button
                                            onClick={() => handleReseal(bid._id)}
                                            className="glass-btn"
                                            style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'var(--warning)', color: 'black' }}
                                        >
                                            RESEAL
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {bids.length > 5 && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button
                        onClick={() => setShowAllBids(!showAllBids)}
                        className="glass-btn"
                        style={{ padding: '0.5rem 2rem' }}
                    >
                        {showAllBids ? 'VIEW LESS' : 'VIEW ALL'}
                    </button>
                </div>
            )}

            {selectedBid && !unsealedData && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '400px' }}>
                        <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>⚠️ RESTRICTED ACTION</h3>
                        <p>Initiating Unseal Protocol for Bid #{selectedBid._id.slice(-6)}.</p>

                        {!otpSent ? (
                            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                                <p style={{ marginBottom: '1rem' }}>Authentication Required.</p>
                                <button
                                    className="glass-btn"
                                    onClick={handleRequestOtp}
                                    style={{ width: '100%' }}
                                >
                                    REQUEST OTP CODE
                                </button>
                            </div>
                        ) : (
                            <>
                                <p style={{ color: 'var(--success)', fontSize: '0.9rem' }}>✅ OTP Sent to System Console</p>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    style={{ margin: '1rem 0' }}
                                />
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="glass-btn" onClick={handleUnseal}>VERIFY & DECRYPT</button>
                                </div>
                            </>
                        )}

                        <button
                            className="glass-btn"
                            style={{ background: 'transparent', border: '1px solid white', width: '100%', marginTop: '1rem' }}
                            onClick={() => { setSelectedBid(null); setOtpSent(false); }}
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            )}

            {unsealedData && (
                <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--success)', borderRadius: '0.5rem' }}>
                    <h3 style={{ color: 'var(--success)' }}>DECRYPTED DATA</h3>
                    <p><strong>Actual Amount:</strong> ${unsealedData.amount}</p>
                    <p><strong>Document Hash:</strong> Verified ✅</p>
                    <div style={{ marginTop: '1rem' }}>
                        <strong>Supporting Document:</strong><br />
                        <img
                            src={unsealedData.supportingDocument}
                            alt="Supporting Doc"
                            style={{ marginTop: '0.5rem', maxWidth: '100%', maxHeight: '500px', border: '1px solid #555', borderRadius: '4px' }}
                        />
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default OfficerDashboard;
