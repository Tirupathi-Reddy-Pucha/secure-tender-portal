import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    if (!user) return null;

    return (
        <nav className="glass-panel" style={{ marginBottom: '2rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h1 className="neon-text" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)' }}>SECURE<span style={{ color: 'white' }}>TENDER</span></h1>
                {user.role === 'contractor' && (
                    <Link to="/my-bids" style={{ color: 'white', textDecoration: 'none', marginLeft: '2rem', fontSize: '0.9rem' }}>My Bids</Link>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                    Logged in as <strong style={{ color: 'white', textTransform: 'uppercase' }}>{user.role}</strong>
                </span>
                <button onClick={() => { logout(); navigate('/'); }} className="glass-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
