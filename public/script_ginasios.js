const LISTA_TIPOS = [
    "agua", "dragao", "eletrico", "fada", "fantasma", "fogo", 
    "gelo", "inseto", "lutador", "metalico", "normal", "pedra", 
    "planta", "psiquico", "sombrio", "terra", "venenoso", "voador"
];

let dadosGinasios = {};
let tipoAtual = null; 
let slotAtual = null; 
let listaTodosPokemons = []; 

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    renderizarGrid();
    carregarListaPokeAPI(); 
});

async function carregarDados() {
    try {
        const res = await fetch('/api/ginasios');
        dadosGinasios = await res.json();
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}

function renderizarGrid() {
    const grid = document.getElementById('grid-ginasios');
    grid.innerHTML = '';
    LISTA_TIPOS.forEach(tipo => {
        const img = document.createElement('img');
        img.src = `imagens/insignia_${tipo}.png`;
        img.alt = tipo;
        img.style.cursor = 'pointer';
        img.onclick = () => abrirModalGinasio(tipo);
        grid.appendChild(img);
    });
}

// --- MODAL DO GINÁSIO ---

function abrirModalGinasio(tipo) {
    tipoAtual = tipo;
    
    // Garante que existe dado
    if (!dadosGinasios[tipo]) {
        dadosGinasios[tipo] = { lider: "", time: [null, null, null, null, null, null] };
    }
    const dados = dadosGinasios[tipo];
    
    document.getElementById('modal-ginasio').style.display = 'flex';
    document.getElementById('modal-titulo').innerText = `Ginásio de ${tipo.toUpperCase()}`;
    
    const modeCreate = document.getElementById('mode-create');
    const modeManage = document.getElementById('mode-manage');
    const inputNick = document.getElementById('modal-input-nick');
    const labelName = document.getElementById('modal-leader-name');
    
    // LÓGICA DE ESTADOS
    if (dados.lider && dados.lider !== "") {
        // MODO GERENCIAR (Já tem dono)
        modeCreate.style.display = 'none';
        modeManage.style.display = 'block';
        labelName.innerText = dados.lider;
        atualizarSkinPreview(dados.lider);
    } else {
        // MODO CRIAR (Vazio)
        modeManage.style.display = 'none';
        modeCreate.style.display = 'block';
        inputNick.value = "";
        atualizarSkinPreview(""); // Skin padrão
    }

    // Atualiza preview ao digitar no modo criar
    inputNick.oninput = () => atualizarSkinPreview(inputNick.value);

    renderizarTime(dados.time);
}

function atualizarSkinPreview(nick) {
    const img = document.getElementById('modal-skin');
    if(nick && nick !== "") {
        img.src = `https://mc-heads.net/avatar/${nick}/100`;
    } else {
        img.src = 'imagens/skin_padrao.png';
    }
}

function renderizarTime(time) {
    for(let i=0; i<6; i++) {
        const slotDiv = document.getElementById(`slot-${i}`);
        const pokemon = time[i]; // Objeto { nome, sprite }

        slotDiv.innerHTML = ''; // Limpa o slot

        if(pokemon) {
            // Se tem pokemon, mostra imagem, nome e botão X
            slotDiv.innerHTML = `
                <div class="btn-remove-poke" onclick="removerPokemon(${i}, event)">x</div>
                <img src="${pokemon.sprite}">
                <span>${pokemon.nome}</span>
            `;
        } else {
            // Se não tem, mostra o +
            slotDiv.innerHTML = `<span style="font-size: 24px; color: #777;">+</span>`;
        }
    }
}

function fecharModal() {
    document.getElementById('modal-ginasio').style.display = 'none';
}

// --- AÇÕES DO GINÁSIO ---

async function salvarLider() {
    const nick = document.getElementById('modal-input-nick').value.trim();
    if(!nick) return alert("Digite um nick!");

    dadosGinasios[tipoAtual].lider = nick;
    await enviarAtualizacao();
    
    // Recarrega o modal para mudar para o "Modo Gerenciar"
    abrirModalGinasio(tipoAtual);
}

async function sairDoGinasio() {
    if(!confirm("Tem certeza que deseja abandonar este ginásio?")) return;

    // Reseta localmente
    dadosGinasios[tipoAtual] = { lider: "", time: [null, null, null, null, null, null] };

    // Reseta no servidor
    await fetch('/api/ginasios/reset', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ tipo: tipoAtual })
    });

    fecharModal();
}

async function removerPokemon(index, event) {
    event.stopPropagation(); // Impede que abra a busca ao clicar no X
    
    if(!confirm("Remover este Pokémon?")) return;

    dadosGinasios[tipoAtual].time[index] = null;
    await enviarAtualizacao();
    renderizarTime(dadosGinasios[tipoAtual].time);
}

async function enviarAtualizacao() {
    await fetch('/api/ginasios/update', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            tipo: tipoAtual,
            lider: dadosGinasios[tipoAtual].lider,
            time: dadosGinasios[tipoAtual].time
        })
    });
}

// --- BUSCA DE POKEMON (PokeAPI) ---

async function carregarListaPokeAPI() {
    try {
        // MUDANÇA AQUI: Aumentamos o limite para 10000 para pegar TUDO
        // (Isso inclui formas regionais, megas, etc.)
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
        const data = await res.json();
        listaTodosPokemons = data.results;
        console.log("Lista de Pokémon carregada:", listaTodosPokemons.length);
    } catch (error) {
        console.error("Erro ao carregar lista da PokeAPI:", error);
    }
}

function abrirBuscaPokemon(slotIndex) {
    // Só permite abrir busca se já tiver um líder definido (Modo Gerenciar) 
    // OU se estiver no meio do processo.
    // Se preferir que só funcione depois de salvar o líder:
    if (dadosGinasios[tipoAtual].lider === "") {
        return alert("Defina e salve um líder primeiro!");
    }

    slotAtual = slotIndex;
    document.getElementById('modal-busca').style.display = 'flex';
    const input = document.getElementById('busca-poke-input');
    input.value = '';
    input.focus();
    filtrarPokemon(); 
}

function fecharBusca() {
    document.getElementById('modal-busca').style.display = 'none';
}

function filtrarPokemon() {
    const termo = document.getElementById('busca-poke-input').value.toLowerCase();
    const container = document.getElementById('lista-pokemon-result');
    container.innerHTML = '';

    if (listaTodosPokemons.length === 0) {
        container.innerHTML = '<div style="padding:10px; color:white;">Carregando...</div>';
        return;
    }
    const filtrados = listaTodosPokemons.filter(p => p.name.includes(termo)).slice(0, 20);

    filtrados.forEach(p => {
        const div = document.createElement('div');
        div.className = 'poke-result-item';
        div.innerText = p.name.toUpperCase();
        div.onclick = () => selecionarPokemon(p.name, p.url);
        container.appendChild(div);
    });
}

async function selecionarPokemon(nome, url) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        let sprite = data.sprites.front_default;
        if(data.sprites.versions && data.sprites.versions['generation-v'] && data.sprites.versions['generation-v']['black-white'].animated.front_default) {
             sprite = data.sprites.versions['generation-v']['black-white'].animated.front_default;
        }

        dadosGinasios[tipoAtual].time[slotAtual] = {
            nome: nome.toUpperCase(),
            sprite: sprite
        };

        await enviarAtualizacao();
        renderizarTime(dadosGinasios[tipoAtual].time);
        fecharBusca();

    } catch (error) {
        alert("Erro ao buscar sprite.");
    }
}function renderizarTime(time) {
    for(let i=0; i<6; i++) {
        const slotDiv = document.getElementById(`slot-${i}`);
        const pokemon = time[i]; 

        slotDiv.innerHTML = ''; 

        if(pokemon) {
            slotDiv.innerHTML = `
                <button class="btn-remove-poke" onclick="removerPokemon(${i}, event)">x</button>
                <img src="${pokemon.sprite}">
                <span>${pokemon.nome}</span>
            `;
        } else {
            slotDiv.innerHTML = `<span style="font-size: 24px; color: #777;">+</span>`;
        }
    }
}