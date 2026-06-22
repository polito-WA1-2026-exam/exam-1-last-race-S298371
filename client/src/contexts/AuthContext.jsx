import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    
    const [user, setUser] = useState(null); //non log
    const [loading, setLoading] = useState(true); //log

    useEffect(() => {
        checkSession();   
    }, []);

    const checkSession = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/sessions/current', {
                credentials: 'include' 
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
            setLoading(false); 
        }
    };

    // call from login form
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
                return { success: false, message: errData.message || 'Login failed' };
            }
        } catch (err) {
            return { success: false, message: 'connection error' };
        }
    };

    //function from navbar
    const logout = async () => {
        try {
            await fetch('http://localhost:3001/api/sessions/current', {
                method: 'DELETE',
                credentials :'include'
            });
            setUser(null); 
        } catch (err) {
            console.error("Error during logout:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};