'use strict';

const db = require('./db'); 
const crypto = require('crypto'); 

//get user from id
exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else if (row === undefined) {
                resolve(null);
            } else {
                const user = { id: row.id, username: row.username };
                resolve(user);
            }
        });
    });
};

//login function
exports.getUser = (username, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE username = ?';
        db.get(sql, [username], (err, row) => {
            if (err) {
                reject(err);
            } else if (row === undefined) {
                resolve(false); 
            } else {
                crypto.scrypt(password, row.salt, 64, (err, hashedPassword) => {
                    if (err) return reject(err);
                  
                    const passwordTarget = hashedPassword.toString('hex');
                    
                    const dbBuffer = Buffer.from(row.password_hash, 'hex');
                    const targetBuffer = Buffer.from(passwordTarget, 'hex');


                    if (dbBuffer.length !== targetBuffer.length) {
                        return resolve(false); 
                    }

                    if (crypto.timingSafeEqual(dbBuffer, targetBuffer)) {    
 
                        const user = { id: row.id, username: row.username };
                        resolve(user);
                    } else {
                        // wrong password
                        resolve(false);
                    }
                });
            }
        });
    });
};