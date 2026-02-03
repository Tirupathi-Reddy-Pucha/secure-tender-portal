import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await login(formData.username, formData.password);
            if (res.role === 'contractor') navigate('/contractor');
            else if (res.role === 'officer') navigate('/officer');
            else if (res.role === 'auditor') navigate('/auditor');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
                <h2 className="neon-text" style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>SYSTEM ACCESS</h2>
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>USER ID</label>
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Enter Username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>PASSPHRASE</label>
                        <input
                            type="password"
                            className="glass-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="glass-btn" style={{ marginTop: '1rem' }}>AUTHENTICATE</button>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>New User? </span>
                        <span
                            onClick={() => navigate('/register')}
                            style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Register
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
