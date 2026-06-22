// src/components/Game.jsx
import { useState, useEffect } from 'react';
import './Game.css'; 

export default function Game() {
    const [gameState, setGameState] = useState('SETUP');
    const [network, setNetwork] = useState(null);
    const [loadingMap, setLoadingMap] = useState(true);

    const [startStation, setStartStation] = useState(null);
    const [destStation, setDestStation] = useState(null);
    const [availableSegments, setAvailableSegments] = useState([]);
    const [timeLeft, setTimeLeft] = useState(90);
    const [chosenRoute, setChosenRoute] = useState([]);

    const [validationResult, setValidationResult] = useState(null);
    const [score, setScore] = useState(0);
    const [events, setEvents] = useState([]);
    
    const [executionStep, setExecutionStep] = useState(-1);
    const [currentCoins, setCurrentCoins] = useState(20);

    // Caricamento mappa reale dal backend
    useEffect(() => {
        const fetchNetwork = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/network', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    setNetwork(data);
                }
            } catch (error) {
                console.error("Errore mappa", error);
            } finally {
                setLoadingMap(false);
            }
        };
        fetchNetwork();
    }, []);

    // Timer per la Fase 2
    useEffect(() => {
        let timer = null;
        if (gameState === 'PLANNING' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (gameState === 'PLANNING' && timeLeft === 0) {
            handleSubmitRoute();
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    // Animazione del viaggio (Fase 3)
    useEffect(() => {
        if (gameState === 'EXECUTION') {
            if (executionStep < events.length) {
                const timer = setTimeout(() => {
                    setExecutionStep(prev => prev + 1);
                    if (executionStep >= 0 && events[executionStep]) {
                        setCurrentCoins(prev => prev + events[executionStep].modifier);
                    }
                }, 2500); 
                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => setGameState('RESULT'), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [gameState, executionStep, events]);

    const handleStartGame = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/games/start', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setStartStation(data.partenza);
                setDestStation(data.destinazione);
                setAvailableSegments(data.connections);
                setChosenRoute([]);
                setGameState('PLANNING');
                setTimeLeft(90);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddSegment = (segment) => {
        if (!chosenRoute.find(s => s.id === segment.id)) {
            setChosenRoute([...chosenRoute, segment]);
        }
    };

    const handleUndoSegment = () => {
        setChosenRoute(chosenRoute.slice(0, -1));
    };

    const handleSubmitRoute = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/games/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ percorso: chosenRoute })
            });
            
            if (response.ok) {
                const data = await response.json();
                setValidationResult(data.esito);
                setScore(data.punteggio);
                setEvents(data.eventi);
                if (data.esito === 'invalido'){
                    setGameState('RESULT');
                } else{
                    setExecutionStep(-1);
                    setCurrentCoins(20);
                    setGameState('EXECUTION');
                }
            }
        } catch (err) {
            console.error("Errore validazione", err);
        }
    };

    // 🛡️ CONTROLLO DI SICUREZZA BLOCCANTE: Se la mappa sta caricando O se network è ancora null,
    // interrompiamo subito il rendering restituendo una schermata di attesa pulita.
    // Questo trucco impedisce ai .map() sottostanti di andare in crash!
    if (loadingMap || !network || !network.lines || !network.stations) {
        return (
            <div className="game-container" style={{ textAlign: 'center', marginTop: '60px' }}>
                <h3>🏎️ Caricamento della mappa del circuito in corso...</h3>
            </div>
        );
    }

    // --- FASE 1: SETUP ---
    if (gameState === 'SETUP') {
        return (
            <div className="game-container">
                <h1 style={{ textAlign: 'center', color: 'var(--mk-primary-red)', marginBottom: '30px' }}>🗺️ FASE 1: SETUP CIRCUITO</h1>
                
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <button className="mk-btn mk-btn-success" style={{ padding: '16px 40px', fontSize: '1.2rem' }} onClick={handleStartGame}>
                        Sono pronto! Avvia il tracciato
                    </button>
                </div>

                <div className="game-layout">
                    <div className="main-panel">
                        <div className="mk-card">
                            <div className="mk-card-header bg-dark-header">Linee e Connessioni della Rete</div>
                            <div className="mk-card-body">
                                {network.lines.map(line => (
                                    <div key={line.id} style={{ marginBottom: '20px' }}>
                                        <h4 style={{ color: line.color, margin: '0 0 10px 0' }}>{line.name}</h4>
                                        <ul style={{ color: '#555', paddingLeft: '20px' }}>
                                            {network.connections.filter(c => c.line_id === line.id).map(c => {
                                                const stA = network.stations.find(s => s.id === c.station_a_id);
                                                const stB = network.stations.find(s => s.id === c.station_b_id);
                                                // Protezione ulteriore se non trova la stazione nel DB
                                                if (!stA || !stB) return null;
                                                return <li key={c.id} style={{ padding: '4px 0' }}>{stA.name} ↔ {stB.name}</li>;
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-panel">
                        <div className="mk-card">
                            <div className="mk-card-header bg-secondary-header">Stazioni abilitate</div>
                            <div className="mk-card-body">
                                <div className="badge-grid">
                                    {network.stations.map(station => (
                                        <span className="mk-badge badge-info" key={station.id}>
                                            {station.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- FASE 2: PLANNING ---
    if (gameState === 'PLANNING') {
        return (
            <div className="game-container">
                <div className="mk-alert-warning">
                    <h2 style={{ margin: 0 }}>⏳ Tempo rimasto: <strong>{timeLeft}</strong> secondi</h2>
                </div>

                <div className="game-layout">
                    <div className="sidebar-panel">
                        <div className="mk-card" style={{ border: '2px solid var(--mk-accent-blue)' }}>
                            <div className="mk-card-header bg-blue-header">La tua Missione</div>
                            <div className="mk-card-body">
                                <p style={{ fontSize: '1.1rem', margin: '0 0 10px 0' }}>🟢 Partenza: <strong style={{ color: '#28a745' }}>{startStation?.name}</strong></p>
                                <hr style={{ border: '0', borderTop: '1px solid #ddd', margin: '15px 0' }} />
                                <p style={{ fontSize: '1.1rem', margin: 0 }}>🔴 Destinazione: <strong style={{ color: 'var(--mk-primary-red)' }}>{destStation?.name}</strong></p>
                            </div>
                        </div>

                        <div className="mk-card">
                            <div className="mk-card-header bg-dark-header">Il tuo Tracciato</div>
                            <div className="mk-card-body">
                                <ol style={{ paddingLeft: '20px', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                                    {chosenRoute.map((seg, index) => {
                                        const stA = network.stations.find(s => s.id === seg.station_a_id);
                                        const stB = network.stations.find(s => s.id === seg.station_b_id);
                                        if (!stA || !stB) return null;
                                        return (
                                            <li key={index} style={{ fontSize: '0.95rem', padding: '2px 0' }}>
                                                {stA.name} ↔ {stB.name}
                                            </li>
                                        );
                                    })}
                                </ol>
                                {chosenRoute.length === 0 && <p style={{ color: '#888', fontStyle: 'italic', marginBottom: '20px' }}>Nessun segmento scelto.</p>}
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="mk-btn mk-btn-outline" style={{ fontSize: '0.85rem' }} onClick={handleUndoSegment} disabled={chosenRoute.length === 0}>
                                        Annulla
                                    </button>
                                    <button className="mk-btn mk-btn-primary" style={{ flexGrow: 1, fontSize: '0.85rem' }} onClick={handleSubmitRoute}>
                                        Invia Percorso
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="main-panel">
                        <div className="mk-card">
                            <div className="mk-card-header bg-dark-header">Mappa dei Circuiti Box</div>
                            <div className="mk-card-body">
                                <div className="badge-grid">
                                    {network.stations.map(station => {
                                        let cls = "badge-secondary";
                                        if (station.id === startStation?.id) cls = "badge-success";
                                        if (station.id === destStation?.id) cls = "badge-danger";
                                        return (
                                            <span className={`mk-badge ${cls}`} key={station.id}>
                                                {station.name}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="mk-card">
                            <div className="mk-card-header bg-secondary-header">Seleziona i Binari (Massimo un utilizzo)</div>
                            <div className="mk-card-body" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                <div className="badge-grid">
                                    {availableSegments.map(seg => {
                                        const stA = network.stations.find(s => s.id === seg.station_a_id);
                                        const stB = network.stations.find(s => s.id === seg.station_b_id);
                                        if (!stA || !stB) return null;
                                        const isSelected = chosenRoute.some(c => c.id === seg.id);
                                        return (
                                            <button 
                                                key={seg.id} 
                                                className={`mk-btn ${isSelected ? 'mk-btn-success' : 'mk-btn-outline'}`}
                                                style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                                                onClick={() => handleAddSegment(seg)}
                                                disabled={isSelected}
                                            >
                                                {stA.name} ↔ {stB.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- FASE 3: EXECUTION ---
    if (gameState === 'EXECUTION') {
        return (
            <div className="game-container text-center">
                <div className="center-box">
                    <h2 style={{ marginBottom: '25px' }}>🚂 Corsa sul Tracciato in Corso...</h2>
                    
                    {validationResult === 'invalido' ? (
                        <div className="mk-card execution-card" style={{ backgroundColor: '#f8d7da', padding: '30px', borderRadius: '8px' }}>
                            <h3 style={{ color: '#721c24', margin: '0 0 10px 0' }}>❌ SQUALIFICA IMMEDIATA!</h3>
                            <p style={{ color: '#721c24', margin: 0 }}>
                                Il percorso sottomesso è invalido: la catena ferroviaria è interrotta, non collega partenza-destinazione oppure il tempo è scaduto!
                            </p>
                        </div>
                    ) : (
                        <div className="mk-card execution-card" style={{ borderRadius: '8px' }}>
                            <div className="mk-card-header" style={{ backgroundColor: 'var(--mk-coin-gold)', color: '#212529', fontSize: '1.4rem' }}>
                                <strong>🪙 Portafoglio Corrente: {currentCoins} Monete</strong>
                            </div>
                            <div className="mk-card-body" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {executionStep === -1 ? (
                                    <h3>Partenza dal Blocco: <span style={{ color: '#28a745' }}>{startStation?.name}</span></h3>
                                ) : executionStep < events.length ? (
                                    <div>
                                        <h5 style={{ color: '#666', margin: '0 0 10px 0' }}>Segmento {executionStep + 1} di {events.length}</h5>
                                        <p style={{ fontSize: '1.25rem', fontWeight: '500', margin: '15px 0' }}>{events[executionStep]?.description}</p>
                                        <span className={`mk-badge ${events[executionStep]?.modifier > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '1.2rem', padding: '8px 20px' }}>
                                            {events[executionStep]?.modifier > 0 ? "+" : ""}{events[executionStep]?.modifier} monete
                                        </span>
                                    </div>
                                ) : (
                                    <h3>🏁 Linea d'arrivo raggiunta con successo!</h3>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- FASE 4: RESULT ---
    if (gameState === 'RESULT') {
        const isVal = validationResult === 'valido';
        return (
            <div className="game-container text-center">
                <div className={`center-box mk-card ${isVal ? 'result-card-valid' : 'result-card-invalid'}`} style={{ padding: '40px', borderRadius: '10px', backgroundColor: '#ffffff' }}>
                    <h1 style={{ fontSize: '4rem', margin: '0 0 20px 0' }}>{isVal ? '🏆' : '❌'}</h1>
                    <h2 style={{ margin: '0 0 10px 0' }}>Partita Conclusa!</h2>
                    <h3 style={{ fontSize: '1.6rem', color: '#555', margin: '0 0 30px 0' }}>
                        Punteggio ottenuto: <strong style={{ color: isVal ? '#28a745' : 'var(--mk-primary-red)' }}>{score}</strong> {score === 1 ? 'moneta': 'monete'}
                    </h3>
                    
                    <button className="mk-btn mk-btn-primary" style={{ padding: '14px 40px', fontSize: '1.1rem' }} onClick={() => setGameState('SETUP')}>
                        🔄 Gareggia Ancora
                    </button>
                </div>
            </div>
        );
    }

    return null;
}