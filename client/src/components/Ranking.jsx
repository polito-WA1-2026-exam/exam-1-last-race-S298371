import React, { useState, useEffect } from 'react';
import './Ranking.css';

export default function Ranking() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/ranking', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setRanking(data);
                } else {
                    setErrorMsg('Unable to load the ranking. Please check your authentication.');
                }
            } catch (err) {
                setErrorMsg('Connection error with the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    return (
        <div className="ranking-container">
            <h2 className="ranking-title"> Ranking</h2>
            
            {loading && (
                <div className="loading-box">
                    <div className="mk-spinner"></div>
                    <p>Loading ranking</p>
                </div>
            )}

            {errorMsg && <div className="mk-alert-danger"> {errorMsg}</div>}

            {!loading && !errorMsg && (
                <div className="ranking-card">
                    <table className="mk-table">
                        <thead>
                            <tr>
                                <th className="col-position">Position</th>
                                <th>User</th>
                                <th className="col-score">Best Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((row, index) => {
                                
                                let positionClass = '';
                                let medal = `${index + 1}°`;
                                
                                if (index === 0) { positionClass = 'gold-row'; medal = ' 1st'; }
                                else if (index === 1) { positionClass = 'silver-row'; medal = ' 2nd'; }
                                else if (index === 2) { positionClass = 'bronze-row'; medal = ' 3rd'; }

                                return (
                                    <tr key={row.username} className={positionClass}>
                                        <td className="pos-cell">{medal}</td>
                                        <td className="pilot-cell"><strong>{row.username}</strong></td>
                                        <td className="score-cell"> {row.top_score} scores</td>
                                    </tr>
                                );
                            })}
                            {ranking.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="empty-row">
                                        No games recorded in the database.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}