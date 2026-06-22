// src/components/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Login.css'; // Caricamento del CSS personalizzato

export default function Login() {
    // 1. Stati locali controllati per i campi di testo (Teoria dei Form)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // 2. Importiamo la logica di login dal contesto globale e il navigatore del Router
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // 3. Funzione di sottomissione asincrona
    const handleSubmit = async (event) => {
        event.preventDefault(); // Impedisce il ricaricamento della pagina (Requisito SPA)
        setErrorMessage('');

        // Validazione client-side immediata (Fail-Fast sul client)
        if (!username.trim() || !password.trim()) {
            setErrorMessage("Inserisci username e password.");
            return;
        }

        try {
            // Eseguiamo la chiamata tramite la funzione del contesto
            const result = await login(username, password);
            // Se l'autenticazione ha successo, deviamo l'utente sulla Home protetta
            if(result && result.success){
                navigate('/');
            } else{
                setErrorMessage(result.message || "Username o password errati")
            }
        } catch (err) {
            // Gestione dell'errore (Es: credenziali errate o errore express-validator 422)
            console.error("Errore durante l'autenticazione:", err);
            setErrorMessage("Errore di rete o server non raggiungibile");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">LOGIN</h1>
                <p className="login-subtitle">Inserisci le tue credenziali </p>

                {/* Se presente un errore, mostriamo l'alert dinamico */}
                {errorMessage && <div className="error-alert">⚠️ {errorMessage}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Campo Input: Username */}
                    <div className="form-group">
                        <label htmlFor="username">Username Pilota</label>
                        <input
                            type="text"
                            id="username"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Es: Mario_99"
                        />
                    </div>

                    {/* Campo Input: Password */}
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Bottone di invio */}
                    <button type="submit" className="submit-btn">
                        Scendi in Pista
                    </button>
                </form>
            </div>
        </div>
    );
}