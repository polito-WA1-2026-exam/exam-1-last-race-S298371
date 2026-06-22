PRAGMA foreign_keys = OFF;

DELETE FROM games;
DELETE FROM connections;
DELETE FROM lines;
DELETE FROM events;
DELETE FROM stations;
DELETE FROM users;
DELETE FROM sqlite_sequence;

PRAGMA foreign_keys = ON;

-- 1. Inserimento Utenti con Password 'password' per tutti e tre, cifrate con crypto (pbkdf2)
-- Ogni utente ha un salt casuale univoco di 16 byte (in esadecimale)
INSERT INTO users (id, username, password_hash, salt) VALUES (1, 'principessa_nina', 'b0e58959448c9fd08541e7d2aa803be1bac4b6631a31ed454ed0693be1a50fcffbe4ada36a49f7acc62ba848134899fd1a96829c109b0fa6d7c93b84cac3c830', '1234567890abcdef');
INSERT INTO users (id, username, password_hash, salt) VALUES (2, 'wapol', '1baec5747b78ef6d8080637549121b3c15e0b192f4fef44b7a2ffea74df5850f0d39c6252cd69e77c8b1b055e409a6185155cc5ef13e801ca5ccaaa09422dee8', 'abcdef1234567890');
INSERT INTO users (id, username, password_hash, salt) VALUES (3, 'Enri Jr', '1039fb49c3678a0ae97a0677f5a05763674e4fe14e1feb74377aa2d6cde909f8556e0c486d84b48df06665a04aefa49a51bf279d2569c52dc7c6142ee714b8ce', 'fedcba9876543210');
-- 2. Inserimento delle 12 Stazioni (Identificate univocamente)
INSERT INTO stations (id, name) VALUES (1, 'Casa di Mario');
INSERT INTO stations (id, name) VALUES (2, 'Regno dei Funghi');
INSERT INTO stations (id, name) VALUES (3, 'Circuito di Luigi');
INSERT INTO stations (id, name) VALUES (4, 'Castello di Peach');   -- INTERSCAMBIO 1
INSERT INTO stations (id, name) VALUES (5, 'Bosco dei Boos');
INSERT INTO stations (id, name) VALUES (6, 'Desert Land');
INSERT INTO stations (id, name) VALUES (7, 'Yoshi Island');        -- INTERSCAMBIO 2
INSERT INTO stations (id, name) VALUES (8, 'Spiaggia di Peach');
INSERT INTO stations (id, name) VALUES (9, 'Valle di Bowser');      -- INTERSCAMBIO 3
INSERT INTO stations (id, name) VALUES (10, 'Pista Arcobaleno');
INSERT INTO stations (id, name) VALUES (11, 'Castello di Bowser');
INSERT INTO stations (id, name) VALUES (12, 'Miniera di Wario');

-- 3. Inserimento delle 4 Linee
INSERT INTO lines (id, name, color) VALUES (1, 'Linea Toad', 'Red');
INSERT INTO lines (id, name, color) VALUES (2, 'Linea Yoshi', 'Blue');
INSERT INTO lines (id, name, color) VALUES (3, 'Linea Daisy', 'Green');
INSERT INTO lines (id, name, color) VALUES (4, 'Linea Wario', 'Yellow');

-- 4. Inserimento delle Connessioni (La mappa ferroviaria pulita)
-- LINEA 1 (Toad - Rossa): Casa di Mario <-> Regno dei Funghi <-> Circuito di Luigi <-> Castello di Peach
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (1, 2, 1);
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (2, 3, 1);
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (3, 4, 1);

-- LINEA 2 (Yoshi - Blu): Castello di Peach <-> Bosco dei Boos <-> Desert Land <-> Yoshi Island
-- Nota: Inizia dall'Interscambio 1 (Peach) e finisce all'Interscambio 2 (Yoshi Island)
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (4, 5, 2);
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (5, 6, 2);
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (6, 7, 2);

-- LINEA 3 (Daisy - Verde): Yoshi Island <-> Spiaggia di Peach <-> Valle di Bowser
-- Nota: Inizia dall'Interscambio 2 (Yoshi Island) e finisce all'Interscambio 3 (Valle di Bowser)
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (7, 8, 3);
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (8, 9, 3);

-- LINEA 4 (Wario - Gialla): Valle di Bowser <-> Pista Arcobaleno <-> Castello di Bowser <-> Miniera di Wario
-- Nota: Si connette all'Interscambio 3 (Valle di Bowser)
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (9, 10, 4);
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (10, 11, 4);
INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (11, 12, 4);

-- 5. Inserimento degli 8 Eventi Casuali richiesti (Effetti compresi tra -4 e +4)
INSERT INTO events (description, effect) VALUES ('Viaggio tranquillo sul rettilineo', 0);
INSERT INTO events (description, effect) VALUES ('Fungo Scatto! Corri più veloce', 1);
INSERT INTO events (description, effect) VALUES ('Superata una trappola di banane con stile', 2);
INSERT INTO events (description, effect) VALUES ('Hai preso il Cubo Oggetto... Cubo di Monete!', 4);
INSERT INTO events (description, effect) VALUES ('Colpito da un Guscio Blu!', -4);
INSERT INTO events (description, effect) VALUES ('Sbandata fuori pista sul fango', -2);
INSERT INTO events (description, effect) VALUES ('Vista offuscata dalla pece del polpo', -3);
INSERT INTO events (description, effect) VALUES ('Un passeggero gentile ti regala una moneta', 1);

-- 6. Popolamento Storico Partite (Almeno 2 utenti devono aver già giocato con successo)
INSERT INTO games (user_id, score, date) VALUES (1, 24, '2026-06-12');
INSERT INTO games (user_id, score, date) VALUES (1, 15, '2026-06-13');
INSERT INTO games (user_id, score, date) VALUES (2, 32, '2026-06-12');