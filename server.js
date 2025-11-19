require('dotenv').config(); // Carrega as variáveis do .env
console.log("🚀 INICIANDO VERSÃO COM MONGODB...");
// require('dotenv').config(); ... (o resto do código continua igual)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- CONEXÃO COM O MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conectado ao MongoDB com sucesso!'))
    .catch(err => console.error('❌ Erro ao conectar no MongoDB:', err));

// --- MODELOS (A cara dos dados) ---

// Modelo do Treinador
const TreinadorSchema = new mongoose.Schema({
    nick: String,
    insignias: [String], // Lista de textos (ids das insignias)
    dataCriacao: { type: Date, default: Date.now }
});
const Treinador = mongoose.model('Treinador', TreinadorSchema);

// Modelo do Ginásio
const GinasioSchema = new mongoose.Schema({
    tipo: { type: String, unique: true }, // Ex: 'agua', 'fogo'
    lider: String,
    time: [Object] // Lista com os 6 pokemons
});
const Ginasio = mongoose.model('Ginasio', GinasioSchema);

// --- INICIALIZAÇÃO (Cria os ginásios se não existirem) ---
const LISTA_TIPOS = [
    "agua", "dragao", "eletrico", "fada", "fantasma", "fogo", 
    "gelo", "inseto", "lutador", "metalico", "normal", "pedra", 
    "planta", "psiquico", "sombrio", "terra", "venenoso", "voador"
];

async function inicializarGinasios() {
    const contagem = await Ginasio.countDocuments();
    if (contagem === 0) {
        console.log("⚙️ Criando ginásios no banco pela primeira vez...");
        for (const tipo of LISTA_TIPOS) {
            await Ginasio.create({
                tipo: tipo,
                lider: "",
                time: [null, null, null, null, null, null]
            });
        }
        console.log("✅ Ginásios criados!");
    }
}
inicializarGinasios();


// --- ROTAS (Agora usando o Mongoose) ---

// 1. Pegar Treinadores
app.get('/api/treinadores', async (req, res) => {
    try {
        const treinadores = await Treinador.find();
        res.json(treinadores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Criar Treinador
app.post('/api/treinadores', async (req, res) => {
    try {
        const { nick } = req.body;
        if (!nick) return res.status(400).send('Nick obrigatório');

        const novoTreinador = new Treinador({ nick, insignias: [] });
        await novoTreinador.save();
        
        res.status(201).json(novoTreinador);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Deletar Treinador
app.delete('/api/treinadores/:id', async (req, res) => {
    try {
        await Treinador.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Atualizar Insígnias (Toggle)
app.post('/api/insignias', async (req, res) => {
    try {
        const { treinadorId, insigniaId } = req.body;
        const treinador = await Treinador.findById(treinadorId);

        if (!treinador) return res.status(404).send('Treinador não encontrado');

        if (treinador.insignias.includes(insigniaId)) {
            // Remove
            treinador.insignias = treinador.insignias.filter(id => id !== insigniaId);
        } else {
            // Adiciona
            treinador.insignias.push(insigniaId);
        }

        await treinador.save();
        res.json(treinador);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROTAS DE GINÁSIOS ---

// 5. Pegar Ginásios (Transforma lista em Objeto para o front entender)
app.get('/api/ginasios', async (req, res) => {
    try {
        const listaGinasios = await Ginasio.find();
        const objetoGinasios = {};
        
        listaGinasios.forEach(g => {
            objetoGinasios[g.tipo] = { lider: g.lider, time: g.time };
        });
        
        res.json(objetoGinasios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Atualizar Ginásio
app.post('/api/ginasios/update', async (req, res) => {
    try {
        const { tipo, lider, time } = req.body;
        await Ginasio.findOneAndUpdate({ tipo: tipo }, { lider, time });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Resetar Ginásio
app.post('/api/ginasios/reset', async (req, res) => {
    try {
        const { tipo } = req.body;
        await Ginasio.findOneAndUpdate(
            { tipo: tipo }, 
            { lider: "", time: [null, null, null, null, null, null] }
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});