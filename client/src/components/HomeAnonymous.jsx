
import React from 'react';
import './HomeAnonymous.css'; 

export default function HomeAnonymous(props) {
    const { onNavigateToLogin } = props;

    return (
        <div className="home-anon-container">
            <header className="header-section">
                <h1 className="main-title">Last Race!</h1>
            </header>

            <main>
                <div className="instructions-card">
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
                </div>

                <div className="cta-section">
                    <p className="cta-text">
                        <strong>Log in to play:</strong>
                    </p>
                    <button className="login-btn" onClick={onNavigateToLogin}>
                        Login
                    </button>
                </div>
            </main>
        </div>
    );
}