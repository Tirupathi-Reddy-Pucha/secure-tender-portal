import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="container animate-fade-in">
            <Navbar />
            <div className="glass-panel" style={{ padding: '2rem', minHeight: '80vh' }}>
                {children}
            </div>
        </div>
    );
};

export default Layout;
