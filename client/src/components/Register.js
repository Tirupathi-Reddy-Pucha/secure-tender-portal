import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Register = () => {
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'contractor' });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData.username, formData.email, formData.password, formData.role);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
                <h2 className="neon-text" style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>REGISTER</h2>
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>USERNAME</label>
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Enter Username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>EMAIL</label>
                        <input
                            type="email"
                            className="glass-input"
                            placeholder="Enter Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>PASSWORD</label>
                        <input
                            type="password"
                            className="glass-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>ROLE</label>
                        <select
                            className="glass-input"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            style={{ backgroundImage: 'none' }}
                        >
                            <option value="contractor" style={{ color: 'black' }}>Contractor</option>
                            <option value="officer" style={{ color: 'black' }}>Officer</option>
                        </select>
                    </div>
                    <button type="submit" className="glass-btn" style={{ marginTop: '1rem' }}>REGISTER</button>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Already have an account? </span>
                        <span
                            onClick={() => navigate('/')}
                            style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Login
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
