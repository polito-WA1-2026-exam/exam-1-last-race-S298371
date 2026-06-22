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

    // network uploading
    useEffect(() => {
        const fetchNetwork = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/network', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    setNetwork(data);
                }
            } catch (error) {
                console.error("Error map", error);
            } finally {
                setLoadingMap(false);
            }
        };
        fetchNetwork();
    }, []);

    
    useEffect(() => {
        let timer = null;
        if (gameState === 'PLANNING') {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer); 
                        return 0; 
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (timer) clearInterval(timer); };
    }, [gameState]); 

    useEffect(() => {
        if (gameState === 'PLANNING' && timeLeft === 0) {
            handleSubmitRoute();
        }
    }, [timeLeft, gameState]);
   //events
    useEffect(() => {
        if (gameState === 'EXECUTION') {
            if (executionStep < events.length) {
                const timer = setTimeout(() => {
                    
                    const nextStep = executionStep + 1; 
                    
                    if (nextStep < events.length && events[nextStep]) {
                        setCurrentCoins(curr => Math.max(0, curr + events[nextStep].modifier));
                    }
                   
                    setExecutionStep(nextStep);
                    
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
            //get the user's id
            const payloadSicuro = chosenRoute.map(seg => ({ id: seg.id }));

            const response = await fetch('http://localhost:3001/api/games/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ percorso: payloadSicuro }) 
            });
            

            if (response.ok) {
                const data = await response.json();
                

                setValidationResult(data.esito);
                setScore(data.punteggio);
                setEvents(data.eventi);
                
                if (data.esito === 'invalido') {
                    
                    setGameState('RESULT');
                } else {
                    // valid route
                    setExecutionStep(-1); 
                    setCurrentCoins(20); 
                    setGameState('EXECUTION');
                }
            } else {
                    //invalid route
                setValidationResult('invalido');
                setScore(0);
                setEvents([]);
                setGameState('RESULT');
            }
        } catch (err) {
            
            console.error("Error during path validation:", err);
            setValidationResult('invalido');
            setScore(0);
            setEvents([]);
            setGameState('RESULT');
        }
    };

    if (loadingMap || !network || !network.lines || !network.stations) {
        return (
            <div className="game-container">
                <h3> Loading the circuit map...</h3>
            </div>
        );
    }

    if (gameState === 'SETUP') {
        return (
            <div className="game-container">
                <h1 > PHASE 1: SETUP</h1>
                
                <div className="text-center mb-30">
                    <button className="mk-btn mk-btn-primary"  onClick={handleStartGame}>
                        Start the game
                    </button>
                </div>

                <div className="game-layout">
                    <div className="main-panel">
                        <div className="mk-card">
                            <div className="mk-card-header bg-dark-header">Lines and Connections</div>
                            <div className="mk-card-body">
                                {network.lines.map(line => (
                                    <div key={line.id} className="mb-20">
                                        <h4 className='m-0 mb-10' style={{ color: line.color}}>{line.name}</h4>
                                        <ul className='pl-20 text-gray'>
                                            {network.connections.filter(c => c.line_id === line.id).map(c => {
                                                const stA = network.stations.find(s => s.id === c.station_a_id);
                                                const stB = network.stations.find(s => s.id === c.station_b_id);
                                                if (!stA || !stB) return null;
                                                return <li key={c.id} className='py-4'>{stA.name} ↔ {stB.name}</li>;
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-panel">
                        <div className="mk-card">
                            <div className="mk-card-header bg-secondary-header">Stations</div>
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

    if (gameState === 'PLANNING') {
        return (
            <div className="game-container">
                <div className="mk-alert-warning">
                    <h2 className='m-0'> Timer: <strong>{timeLeft}</strong> seconds</h2>
                </div>

                <div className="game-layout">
                    <div className="sidebar-panel">
                        <div className="mk-card border-blue">
                            <div className="mk-card-header bg-blue-header">Departure and Arrival stations:</div>
                            <div className="mk-card-body">
                                <p className='font-11 mb-10'>Departure: <strong className='text-success'>{startStation?.name}</strong></p>
                                <hr className="border-light-top mt-15 mb-15"/>
                                <p className="font-11 m-0">Arrival: <strong className="text-danger">{destStation?.name}</strong></p>
                            </div>
                        </div>

                        <div className="mk-card">
                            <div className="mk-card-header bg-dark-header">Your route:</div>
                            <div className="mk-card-body">
                                <ol className='pl-20 mb-20'>
                                    {chosenRoute.map((seg, index) => {
                                        const stA = network.stations.find(s => s.id === seg.station_a_id);
                                        const stB = network.stations.find(s => s.id === seg.station_b_id);
                                        if (!stA || !stB) return null;
                                        return (
                                            <li key={index} className='font-095 py-4'>
                                                {stA.name} ↔ {stB.name}
                                            </li>
                                        );
                                    })}
                                </ol>
                                {chosenRoute.length === 0 && <p className='text-gray-light italic mb-20'>No segment selected.</p>}
                                
                                <div className="flex gap-10">
                                    <button className="mk-btn mk-btn-outline font-085"  onClick={handleUndoSegment} disabled={chosenRoute.length === 0}>
                                        Cancel
                                    </button>
                                    <button className="mk-btn mk-btn-primary flex-grow font-085" onClick={handleSubmitRoute}>
                                        Send route
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="main-panel">
                        <div className="mk-card">
                            <div className="mk-card-header bg-dark-header">Lines map</div>
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
                            <div className="mk-card-header bg-secondary-header">Select the connections</div>
                            <div className="mk-card-body max-h-320 overflow-y-auto">
                                <div className="badge-grid">
                                    {availableSegments.map(seg => {
                                        const stA = network.stations.find(s => s.id === seg.station_a_id);
                                        const stB = network.stations.find(s => s.id === seg.station_b_id);
                                        if (!stA || !stB) return null;
                                        const isSelected = chosenRoute.some(c => c.id === seg.id);
                                        return (
                                            <button 
                                                key={seg.id} 
                                                className={`mk-btn ${isSelected ? 'mk-btn-success' : 'mk-btn-outline'} font-085`}
                                                
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

   
    if (gameState === 'EXECUTION') {
        return (
            <div className="game-container text-center">
                <div className="center-box">
                    <h2 className="mb-25">Race on track...</h2>
                    
                    {validationResult === 'invalido' ? (
                        <div className="mk-card execution-card bg-danger-light p-30 rounded-8">
                            <h3 className="text-danger-dark m-0 mb-10" >Disqualified!</h3>
                            <p className="text-danger-dark m-0">
                                The submitted route is invalid: the railway chain is broken, it does not connect start-destination, or the time has expired!
                            </p>
                        </div>
                    ) : (
                        <div className="mk-card execution-card rounded-8">
                            <div className="mk-card-header" style={{ backgroundColor: 'var(--mk-coin-gold)', color: '#212529', fontSize: '1.4rem' }}>
                                <strong> Score: {currentCoins} coins</strong>
                            </div>
                            <div className="mk-card-body flex flex-col justify-center" style={{ minHeight: '160px' }}>
                                {executionStep === -1 ? (
                                    <h3>Starts: <span className='text-success'>{startStation?.name}</span></h3>
                                ) : executionStep < events.length ? (
                                    <div>
                                        <h5 className="text-gray m-0 mb-10">Segment {executionStep + 1} of {events.length}</h5>
                                        <p className="font-125 font-weight-500 mt-15 mb-15">{events[executionStep]?.description}</p>
                                        <span className={`mk-badge ${events[executionStep]?.modifier > 0 ? 'badge-success' : 'badge-danger'} font-12`}>
                                            {events[executionStep]?.modifier > 0 ? "+" : ""}{events[executionStep]?.modifier} coins
                                        </span>
                                    </div>
                                ) : (
                                    <h3> You are arrived!</h3>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === 'RESULT') {
        const isVal = validationResult === 'valido';
        return (
            <div className="game-container text-center">
                <div className={`center-box mk-card ${isVal ? 'result-card-valid' : 'result-card-invalid'} pt-40 p-30 rounded-10 bg-white`}>
                    <h1 className="font-4rem m-0 mb-20">{isVal ? 'Successful race' : 'Disqualified'} </h1>
                    <h2 className="m-0 mb-10">Game Over! </h2>
                    <h3 className="font-16 text-gray m-0 mb-30">
                        Obtained score: <strong className={isVal ? 'text-success' : 'text-danger'}>{score}</strong> {score === 1 ? 'coin': 'coins'}
                    </h3>
                    
                    <button className="mk-btn mk-btn-primary font-11" onClick={() => setGameState('SETUP')}>
                         Play Again
                    </button>
                </div>
            </div>
        );
    }

    return null;
}