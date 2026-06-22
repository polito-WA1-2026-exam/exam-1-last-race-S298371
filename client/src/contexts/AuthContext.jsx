import React, { createContext, useState, useEffect } from 'react';

// Creiamo il contesto
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // user = null (non loggato), user = {id, username} (loggato)
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    
    // Quando l'app si avvia (o si aggiorna la pagina), verifica se c'è già una sessione
    useEffect(() => {
        checkSession();
        
    }, []);

    const checkSession = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/sessions/current', {
                credentials: 'include' // Vite gestirà le credenziali per il momento
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false); // Il caricamento iniziale è finito
        }
    };

    // Funzione chiamata dal form di Login
    const login = async (username, password) => {
        try {
            const response = await fetch('http://localhost:3001/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data);
                return { success: true };
            } else {
                const errData = await response.json();
                return { success: false, message: errData.message || 'Login fallito' };
            }
        } catch (err) {
            return { success: false, message: 'Errore di connessione' };
        }
    };

    // Funzione chiamata dalla Navbar
    const logout = async () => {
        try {
            await fetch('http://localhost:3001/api/sessions/current', {
                method: 'DELETE',
                credentials :'include'
            });
            setUser(null); // Svuota lo stato utente
        } catch (err) {
            console.error("Errore durante il logout", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};