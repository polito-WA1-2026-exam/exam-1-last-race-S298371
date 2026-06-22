
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import HomeAnonymous from './HomeAnonymous';
import './Home.css'; 

export default function Home() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    //If anonymous
    if (!user) {
        return <HomeAnonymous onNavigateToLogin={() => navigate('/login')} />;
    }
    return (
        <div className="home-logged-container">
            <header className="logged-header">
                <h1 className="welcome-title">Welcome, {user.username}!</h1>
                <p className="logged-subtitle">Read the instructions before playing.</p>
            </header>

            <main>
                <section className="rules-card">
                    <h2>Instructions</h2>
                    <ul className="rules-list">
                        
                        <li>
                            <strong>1. Set up:</strong> You will be shown the map with stations and lines.
                        </li>
                        <li>
                            <strong>2. Games:</strong> When the game starts, you will be shown a starting station and an arrival station, and you have 90 seconds to choose the connections to complete the route from the start to the finish.
                        </li>
                        <li>
                            <strong>3. Line Change Constraints:</strong> Remember that you can change metro lines <em>only</em> by passing through enabled interchange stations.
                        </li>
                    </ul>
                </section>

                {/* button to phase 1*/}
                <section className="action-area">
                    <p>Get ready to play</p>
                    <button className="play-game-btn" onClick={() => navigate('/game')}>
                        Go to the Map
                    </button>
                </section>
            </main>
        </div>
    );
}