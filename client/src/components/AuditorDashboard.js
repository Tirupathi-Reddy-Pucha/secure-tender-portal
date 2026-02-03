import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from './Layout';

const AuditorDashboard = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/logs');
                setLogs(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchLogs();
    }, []);

    return (
        <Layout>
            <h2 style={{ marginBottom: '2rem' }}>AUDIT TRAIL</h2>
            <table>
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>Performed By</th>
                        <th>Role</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log._id}>
                            <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{log.action}</td>
                            <td>{log.performedBy?.username}</td>
                            <td>
                                <span style={{
                                    padding: '0.1rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    {log.performedBy?.role.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{JSON.stringify(log.details)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Layout>
    );
};

export default AuditorDashboard;
