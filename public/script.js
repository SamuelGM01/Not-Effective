const LISTA_INSIGNIAS = [
    "agua", "dragao", "eletrico", "fada", "fantasma", "fogo", 
    "gelo", "inseto", "lutador", "metalico", "normal", "pedra", 
    "planta", "psiquico", "sombrio", "terra", "venenoso", "voador"
];

document.addEventListener('DOMContentLoaded', () => {
    carregarTreinadores();
});

async function carregarTreinadores() {
    try {
        const response = await fetch('/api/treinadores');
        const treinadores = await response.json();
        
        // Ordena alfabeticamente ignorando maiúsculas/minúsculas
        treinadores.sort((a, b) => a.nick.toLowerCase().localeCompare(b.nick.toLowerCase()));

        const container = document.getElementById('lista-treinadores');
        container.innerHTML = ''; 

        treinadores.forEach(treinador => {
            container.appendChild(criarHTMLCard(treinador));
        });

        container.appendChild(criarCardAdicionar());

    } catch (error) {
        console.error("Erro:", error);
    }
}

function criarHTMLCard(treinador) {
    const div = document.createElement('div');
    div.className = 'player-card';
    
    // --- CORREÇÃO AQUI: Link da Skin ---
    // Usando mc-heads que costuma ser mais rápido/confiável
    const skinUrl = `https://mc-heads.net/avatar/${treinador.nick}/100`;

    let htmlInsignias = '';
    LISTA_INSIGNIAS.forEach(tipo => {
        const possui = treinador.insignias && treinador.insignias.includes(tipo);
        const classe = possui ? '' : 'badge-obscured';
        htmlInsignias += `
            <img src="imagens/insignia_${tipo}.png" 
                 alt="${tipo}" class="${classe}" 
                 onclick="toggleInsignia('${treinador.id}', '${tipo}')">
        `;
    });

    div.innerHTML = `
        <img src="${skinUrl}" class="player-skin" onerror="this.src='imagens/skin_padrao.png'">
        
        <div class="player-info">
            <h3>${treinador.nick}</h3>
            <div class="badge-bar">${htmlInsignias}</div>
        </div>
        <button class="btn-delete" onclick="deletarTreinador('${treinador.id}')">X</button>
    `;
    return div;
}

function criarCardAdicionar() {
    const div = document.createElement('div');
    div.className = 'player-card add-card'; 
    
    div.innerHTML = `
        <div class="add-card-inner">
            <input type="text" id="novo-nick-card" class="player-name-input" placeholder="NOVO JOGADOR...">
            <button onclick="adicionarTreinador()" class="btn-add-plus">+</button>
        </div>
    `;
    return div;
}

async function adicionarTreinador() {
    const input = document.getElementById('novo-nick-card');
    // --- CORREÇÃO: Removemos o toUpperCase() para salvar o nick exato ---
    const nick = input.value.trim(); 

    if (!nick) return alert("Digite um nick!");

    await fetch('/api/treinadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: nick })
    });
    
    carregarTreinadores();
}

async function toggleInsignia(treinadorId, insigniaId) {
    await fetch('/api/insignias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treinadorId, insigniaId })
    });
    carregarTreinadores();
}

async function deletarTreinador(id) {
    if(!confirm("Deletar este treinador?")) return;

    await fetch(`/api/treinadores/${id}`, { method: 'DELETE' });
    carregarTreinadores();
}