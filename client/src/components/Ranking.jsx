// src/components/Ranking.jsx
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
                    setErrorMsg('Impossibile caricare la classifica. Verificare l\'autenticazione.');
                }
            } catch (err) {
                setErrorMsg('Errore di connessione con il server.');
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    return (
        <div className="ranking-container">
            <h2 className="ranking-title">🏆 Classifica Generale (Top Scores)</h2>
            
            {loading && (
                <div className="loading-box">
                    <div className="mk-spinner"></div>
                    <p>Caricamento dei campioni in corso...</p>
                </div>
            )}

            {errorMsg && <div className="mk-alert-danger">⚠️ {errorMsg}</div>}

            {!loading && !errorMsg && (
                <div className="ranking-card">
                    <table className="mk-table">
                        <thead>
                            <tr>
                                <th className="col-position">Posizione</th>
                                <th>Pilota / Utente</th>
                                <th className="col-score">Miglior Punteggio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((row, index) => {
                                // Assegnazione dinamica di stili e medaglie per il podio
                                let positionClass = '';
                                let medal = `${index + 1}°`;
                                
                                if (index === 0) { positionClass = 'gold-row'; medal = '🥇 1°'; }
                                else if (index === 1) { positionClass = 'silver-row'; medal = '🥈 2°'; }
                                else if (index === 2) { positionClass = 'bronze-row'; medal = '🥉 3°'; }

                                return (
                                    <tr key={row.username} className={positionClass}>
                                        <td className="pos-cell">{medal}</td>
                                        <td className="pilot-cell"><strong>{row.username}</strong></td>
                                        <td className="score-cell">💰 {row.top_score} monete</td>
                                    </tr>
                                );
                            })}
                            {ranking.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="empty-row">
                                        Nessuna partita registrata nel database. Entra in pista e diventa il primo!
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