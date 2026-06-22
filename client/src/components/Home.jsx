// src/components/Home.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import HomeAnonymous from './HomeAnonymous';
import './Home.css'; 

export default function Home() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Se l'utente non è simulato/loggato, mostra le istruzioni base pubbliche
    if (!user) {
        return <HomeAnonymous onNavigateToLogin={() => navigate('/login')} />;
    }

    // Se l'utente è loggato (o simulato), vede la pagina ufficiale con le regole
    return (
        <div className="home-logged-container">
            <header className="logged-header">
                <h1 className="welcome-title">Welcome, {user.username}!</h1>
                <p className="logged-subtitle">Leggi le istruzioni prima di giocare.</p>
            </header>

            <main>
                {/* Sezione Regole Complete */}
                <section className="rules-card">
                    <h2>Istruzioni </h2>
                    <ul className="rules-list">
                        <li>
                            <strong>1. Percorso Assegnato:</strong> Nella prossima schermata il server genererà per te una stazione di partenza e una di destinazione casuali.
                        </li>
                        <li>
                            <strong>2. Studio della Mappa (Fase di Setup):</strong> Potrai esaminare l'intera mappa delle linee ferroviarie e studiare i collegamenti con calma prima di dare il via.
                        </li>
                        <li>
                            <strong>3. Prova a Tempo (90 Secondi):</strong> Quando cliccherai su <em>"Avvia Partita"</em> nella schermata della mappa, scatterà il conto alla rovescia di <strong>90 secondi</strong> per selezionare i segmenti in successione.
                        </li>
                        <li>
                            <strong>4. Vincoli sui Cambi di Linea:</strong> Ricorda che puoi cambiare linea metropolitana <em>esclusivamente</em> passando dalle stazioni di interscambio abilitate.
                        </li>
                    </ul>
                </section>

                {/* Pulsante che porta alla Fase 1 (Setup Mappa) */}
                <section className="action-area">
                    <p>Preparti a giocare</p>
                    <button className="play-game-btn" onClick={() => navigate('/game')}>
                        🗺️ Vai alla Mappa
                    </button>
                </section>
            </main>
        </div>
    );
}