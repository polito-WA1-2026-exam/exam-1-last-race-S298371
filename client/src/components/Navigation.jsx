
import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Navigation.css';

export default function Navigation() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/'); 
    };

    return (
        <nav className="mk-navbar">
            <div className="mk-navbar-container">
                
                <NavLink to="/" end className="mk-navbar-brand">
                     Last Race
                </NavLink>
                
                <div className="mk-navbar-links">
                    <NavLink to="/" end className="mk-nav-link">Instructions</NavLink>
                    
                    {/* only for log user */}
                    {user && (
                        <>
                            <NavLink to="/game" className="mk-nav-link">Play</NavLink>
                            <NavLink to="/ranking" className="mk-nav-link">Ranking</NavLink>
                        </>
                    )}
                </div>

                <div className="mk-navbar-actions">
                    {user ? (
                        <>
                            <span className="mk-greeting">Welcome, {user.username}!</span>
                            <button className="mk-btn-danger" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <Link to="/login" className="mk-btn-primary-link">Login</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}