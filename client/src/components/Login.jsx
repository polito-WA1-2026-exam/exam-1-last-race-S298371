import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Login.css'; 

export default function Login() {
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

   
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    
    const handleSubmit = async (event) => {
        event.preventDefault(); 
        setErrorMessage('');

       
        if (!username.trim() || !password.trim()) {
            setErrorMessage("Insert username and password.");
            return;
        }

        try {
           
            const result = await login(username, password);
            
            if(result && result.success){
                navigate('/');
            } else{
                setErrorMessage(result.message || "Invalid username or password")
            }
        } catch (err) {
            
            console.error("Errore during the authentication:", err);
            setErrorMessage("Network error or server unreachable");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">LOGIN</h1>
                <p className="login-subtitle">Insert username and password </p>

                {errorMessage && <div className="error-alert"> {errorMessage}</div>}

                <form onSubmit={handleSubmit}>
                    {/*Input: Username */}
                    <div className="form-group">
                        <label htmlFor="username">Pilote Username </label>
                        <input
                            type="text"
                            id="username"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Es: username1"
                        />
                    </div>

                    {/*Input: Password */}
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

                    <button type="submit" className="submit-btn">
                        Start the game
                    </button>
                </form>
            </div>
        </div>
    );
}