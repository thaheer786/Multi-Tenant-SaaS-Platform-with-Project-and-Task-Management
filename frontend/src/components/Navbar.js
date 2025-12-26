import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, tenant, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          SaaS Platform
        </Link>
        <div className="nav-menu">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          {user.role !== 'user' && (
            <>
              <Link to="/projects" className="nav-link">
                Projects
              </Link>
              <Link to="/users" className="nav-link">
                Users
              </Link>
            </>
          )}
          <div className="nav-user">
            <span className="user-info">
              {user.fullName} ({tenant?.name})
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
