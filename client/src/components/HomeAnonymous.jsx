
import React from 'react';
import './HomeAnonymous.css'; // Carichiamo lo stile personalizzato a tema Mario Kart

export default function HomeAnonymous(props) {
    const { onNavigateToLogin } = props;

    return (
        <div className="home-anon-container">
            <header className="header-section">
                <h1 className="main-title">Last Race!</h1>
                <p className="subtitle">Pianifica la tua corsa nella rete sotterranea</p>
            </header>

            <main>
                <div className="instructions-card">
                    <h2>🎮 Regolamento della Corsa</h2>
                    <ul className="instructions-list">
                        <li>
                            <strong>1. La Sfida:</strong> Ti verranno assegnate una stazione di partenza e una di destinazione casuali sulla mappa.
                        </li>
                        <li>
                            <strong>2. Giro di Qualifica (90s):</strong> Avrai un timer di <strong>90 secondi</strong> per selezionare i segmenti in sequenza e comporre il tuo tracciato prima del via. Ogni segmento può essere scelto una sola volta!
                        </li>
                        <li>
                            <strong>3. Interscambi e Linee:</strong> La mappa è composta da più linee metropolitane. Puoi cambiare linea di percorrenza <em>esclusivamente</em> passando dalle stazioni di interscambio.
                        </li>
                        <li>
                            <strong>4. Bonus e Scatole Imprevisto:</strong> Parti con 20 monete. Ogni tratta percorsa attiverà un evento casuale sul server che modificherà il tuo bottino (da -4 a +4 monete). Finire sotto zero azzererà i tuoi punti!
                        </li>
                    </ul>
                </div>

                <div className="cta-section">
                    <p className="cta-text">
                        📢 <strong>Accesso ai Box:</strong> I visitatori anonimi possono solo leggere il regolamento. Per visualizzare la mappa dei circuiti, avviare una gara e salvare i propri record nella classifica dei campioni, è necessario fare il login.
                    </p>
                    <button className="login-btn" onClick={onNavigateToLogin}>
                        Login
                    </button>
                </div>
            </main>
        </div>
    );
}