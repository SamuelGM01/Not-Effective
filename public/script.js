// Lista das 18 insígnias (nomes dos arquivos) para gerar o HTML
const LISTA_INSIGNIAS = [
    "agua", "dragao", "eletrico", "fada", "fantasma", "fogo", 
    "gelo", "inseto", "lutador", "metalico", "normal", "pedra", 
    "planta", "psiquico", "sombrio", "terra", "venenoso", "voador"
];

document.addEventListener('DOMContentLoaded', () => {
    carregarTreinadores();
});

// 1. Busca os dados do servidor e desenha na tela
async function carregarTreinadores() {
    try {
        const response = await fetch('/api/treinadores');
        const treinadores = await response.json();
        
        // Ordena alfabeticamente
        treinadores.sort((a, b) => a.nick.localeCompare(b.nick));

        const container = document.getElementById('lista-treinadores');
        container.innerHTML = ''; // Limpa antes de desenhar

        // Desenha os jogadores existentes
        treinadores.forEach(treinador => {
            container.appendChild(criarHTMLCard(treinador));
        });

        // Desenha o card de "+" no final
        container.appendChild(criarCardAdicionar());

    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}

// 2. Função que cria o HTML de um card de jogador
function criarHTMLCard(treinador) {
    const div = document.createElement('div');
    div.className = 'player-card';
    
    // URL da Skin
    const skinUrl = `https://mc-heads.net/avatar/${treinador.nick}/100`;

    // HTML interno do card
    let htmlInsignias = '';
    LISTA_INSIGNIAS.forEach(tipo => {
        const possui = treinador.insignias && treinador.insignias.includes(tipo);
        const classe = possui ? '' : 'badge-obscured'; 
        
        // --- CORREÇÃO AQUI: Usando _id (do MongoDB) ---
        htmlInsignias += `
            <img src="imagens/insignia_${tipo}.png" 
                 alt="${tipo}" 
                 class="${classe}" 
                 onclick="toggleInsignia('${treinador._id}', '${tipo}')">
        `;
    });

    // --- CORREÇÃO AQUI: Usando _id no botão de deletar também ---
    div.innerHTML = `
        <img src="${skinUrl}" class="player-skin" onerror="this.src='imagens/skin_padrao.png'">
        <div class="player-info">
            <h3>${treinador.nick}</h3>
            <div class="badge-bar">
                ${htmlInsignias}
            </div>
        </div>
        <button class="btn-delete" onclick="deletarTreinador('${treinador._id}')">X</button>
    `;
    return div;
}

// --- Função do Card de Adicionar ---
function criarCardAdicionar() {
    const div = document.createElement('div');
    div.className = 'add-card-container'; 
    
    div.innerHTML = `
        <div class="input-group-centered">
            <input type="text" id="novo-nick-card" class="clean-input" placeholder="NOVO JOGADOR...">
            <button onclick="adicionarTreinador()" class="btn-round-plus">+</button>
        </div>
    `;
    return div;
}

// 3. Envia o novo nick para o servidor
async function adicionarTreinador() {
    const input = document.getElementById('novo-nick-card');
    const nick = input.value.trim(); 

    if (!nick) return alert("Digite um nick!");

    await fetch('/api/treinadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: nick })
    });
    
    carregarTreinadores();
}

// 4. Atualiza a insígnia no servidor
async function toggleInsignia(treinadorId, insigniaId) {
    await fetch('/api/insignias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treinadorId, insigniaId })
    });
    
    // Recarrega para mostrar a mudança visualmente (insígnia colorida)
    carregarTreinadores();
}

// 5. Deletar Treinador
async function deletarTreinador(id) {
    if(!confirm("Tem certeza que deseja remover este treinador?")) return;

    try {
        await fetch(`/api/treinadores/${id}`, {
            method: 'DELETE'
        });
        carregarTreinadores(); 
    } catch (error) {
        console.error("Erro ao deletar treinador:", error);
        alert("Não foi possível remover o treinador.");
    }
}