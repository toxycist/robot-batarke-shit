const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { create } = require('domain');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./batarkes.db', (err) => {
    if (err) {
        console.error("Failed to open database:", err);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

db.run('CREATE TABLE IF NOT EXISTS "batarkes" (numeris INTEGER NOT NULL, pakrauta INTEGER, laikas TIMESTAMP NOT NULL DEFAULT current_timestamp, PRIMARY KEY(numeris))', (err) => {
    if (err) {
        console.error("Error creating table:", err);
    }
});

app.get('/data', (req, res) => {
    db.all('SELECT * FROM batarkes', (err, rows) => {
        if (err) {
            res.status(500).json(err.message);
        } else {
            res.json(rows);
        }
    });
});

app.post('/add', (req, res) => {
    const {numeris: numeris, pakrauta: pakrauta} = req.body;
    createFile(numeris)
    db.run('INSERT INTO batarkes (numeris, pakrauta) VALUES (?, ?)', [numeris, pakrauta], function(err) {
        if (err) {
            res.status(500).json(err.message);
        } else {
            res.json();
        }
    });
});

app.patch('/change', (req, res) => {
    const numeris = req.query.numeris;
    db.run('UPDATE batarkes SET pakrauta = ABS(pakrauta-1), laikas = current_timestamp WHERE numeris = ?', [numeris], function(err) {
        if (err) {
            res.status(500).json(err.message);
        } else {
            res.json();
        }
    });
});

app.delete('/delete', (req, res) => {
    const numeris = req.query.numeris;
    deleteFile(numeris)
    db.run('DELETE FROM batarkes WHERE numeris=?', [numeris], function(err) {
        if (err) {
            res.status(500).json(err.message);
        } else {
            res.json();
        }
    });
});

function createFile(numeris){
    fs.writeFileSync(`${numeris}.html`, `<!DOCTYPE html>
        <html lang="en">
        <head></head>
        <body>
        <script>
            const server_adress = "http://127.0.0.1:3000"
            window.onload = (() =>fetch(server_adress + '/change?numeris=${numeris}', {method: 'PATCH'}).then(window.location.href="index.html"))
        </script>
        </body>
        </html>`)
};

function deleteFile(numeris){
    fs.unlink(`${numeris}.html`, ()=>{})
}

app.listen(port, () => {
    db.all('SELECT * FROM batarkes', (err, rows) => {rows.forEach(row => {
        createFile(row.numeris)
    })})
    console.log(`Server running at http://127.0.0.1:${port}`);
});
