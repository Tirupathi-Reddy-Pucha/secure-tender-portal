import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const { login, verifyOtp } = useContext(AuthContext);
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ username: '', password: '', otp: '' });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (step === 1) {
                const res = await login(formData.username, formData.password);
                if (res.message === 'OTP_SENT') {
                    setStep(2);
                }
            } else {
                const res = await verifyOtp(formData.username, formData.otp);
                if (res.role === 'contractor') navigate('/contractor');
                else if (res.role === 'officer') navigate('/officer');
                else if (res.role === 'auditor') navigate('/auditor');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
                <h2 className="neon-text" style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>
                    {step === 1 ? 'SYSTEM ACCESS' : 'MULTI-FACTOR AUTH'}
                </h2>
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {step === 1 ? (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>USER ID</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Enter Username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    autoFocus
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
                        </>
                    ) : (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#f59e0b' }}>ENTER SECURE OTP</label>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="******"
                                value={formData.otp}
                                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                maxLength="6"
                                autoFocus
                            />
                            <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>
                                check server console for code
                            </small>
                        </div>
                    )}

                    <button type="submit" className="glass-btn" style={{ marginTop: '1rem' }}>
                        {step === 1 ? 'AUTHENTICATE' : 'VERIFY IDENTITY'}
                    </button>

                    {step === 1 && (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>New User? </span>
                            <span
                                onClick={() => navigate('/register')}
                                style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Register
                            </span>
                        </div>
                    )}
                    {step === 2 && (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <span
                                onClick={() => { setStep(1); setError(null); }}
                                style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                ← Cancel
                            </span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
