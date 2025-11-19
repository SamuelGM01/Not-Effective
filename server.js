const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const ARQUIVO_TREINADORES = 'dados.json';
const ARQUIVO_GINASIOS = 'ginasios.json';

// --- ROTAS TREINADORES ---
app.get('/api/treinadores', (req, res) => {
    fs.readFile(ARQUIVO_TREINADORES, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Erro ao ler');
        res.send(JSON.parse(data || '[]'));
    });
});

app.post('/api/treinadores', (req, res) => {
    const novoTreinador = req.body;
    if (!novoTreinador.nick) return res.status(400).send('Nick obrigatório');

    fs.readFile(ARQUIVO_TREINADORES, 'utf8', (err, data) => {
        const treinadores = JSON.parse(data || '[]');
        novoTreinador.id = Date.now().toString();
        novoTreinador.insignias = [];
        treinadores.push(novoTreinador);
        fs.writeFile(ARQUIVO_TREINADORES, JSON.stringify(treinadores, null, 2), (err) => {
            res.status(201).send(novoTreinador);
        });
    });
});

app.post('/api/insignias', (req, res) => {
    const { treinadorId, insigniaId } = req.body;
    fs.readFile(ARQUIVO_TREINADORES, 'utf8', (err, data) => {
        let treinadores = JSON.parse(data || '[]');
        const index = treinadores.findIndex(t => t.id === treinadorId);
        if (index !== -1) {
            const jogador = treinadores[index];
            if (jogador.insignias.includes(insigniaId)) {
                jogador.insignias = jogador.insignias.filter(id => id !== insigniaId);
            } else {
                jogador.insignias.push(insigniaId);
            }
            fs.writeFile(ARQUIVO_TREINADORES, JSON.stringify(treinadores, null, 2), (err) => {
                res.send(jogador);
            });
        } else {
            res.status(404).send('Não encontrado');
        }
    });
});

app.delete('/api/treinadores/:id', (req, res) => {
    const id = req.params.id;
    fs.readFile(ARQUIVO_TREINADORES, 'utf8', (err, data) => {
        let treinadores = JSON.parse(data || '[]');
        const novosTreinadores = treinadores.filter(t => t.id !== id);
        fs.writeFile(ARQUIVO_TREINADORES, JSON.stringify(novosTreinadores, null, 2), (err) => {
            res.status(200).send({ ok: true });
        });
    });
});

// --- ROTAS GINÁSIOS ---

app.get('/api/ginasios', (req, res) => {
    fs.readFile(ARQUIVO_GINASIOS, 'utf8', (err, data) => {
        if (err) return res.send({});
        res.send(JSON.parse(data));
    });
});

// Atualizar (Salvar Líder ou Time)
app.post('/api/ginasios/update', (req, res) => {
    const { tipo, lider, time } = req.body; 
    fs.readFile(ARQUIVO_GINASIOS, 'utf8', (err, data) => {
        let ginasios = JSON.parse(data || '{}');
        ginasios[tipo] = { lider, time };
        fs.writeFile(ARQUIVO_GINASIOS, JSON.stringify(ginasios, null, 2), (err) => {
            if (err) return res.status(500).send('Erro ao salvar');
            res.send({ ok: true });
        });
    });
});

// Resetar Ginásio (Excluir Líder)
app.post('/api/ginasios/reset', (req, res) => {
    const { tipo } = req.body;
    fs.readFile(ARQUIVO_GINASIOS, 'utf8', (err, data) => {
        let ginasios = JSON.parse(data || '{}');
        // Reseta para o estado inicial
        ginasios[tipo] = { lider: "", time: [null, null, null, null, null, null] };
        
        fs.writeFile(ARQUIVO_GINASIOS, JSON.stringify(ginasios, null, 2), (err) => {
            if (err) return res.status(500).send('Erro ao resetar');
            res.send({ ok: true });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});