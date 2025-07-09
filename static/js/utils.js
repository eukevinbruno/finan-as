// =====================
// Funções Utilitárias Comuns (compartilhadas entre várias páginas)
// =====================

/**
 * Configura a formatação de valor monetário (R$ X.XXX,XX) para um campo de input.
 * Garante que o input contenha apenas números e vírgulas/pontos formatados.
 * @param {HTMLInputElement} campoInput O elemento input HTML a ser configurado.
 */
export function configurarFormatacaoValor(campoInput) {
    if (!campoInput) return; // Garante que o input existe antes de configurar

    campoInput.addEventListener('input', function(evento) {
        let valorPuro = evento.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
        if (valorPuro === '') {
            evento.target.value = '0,00';
            return;
        }

        // Garante que haja pelo menos 3 dígitos (para 0,00)
        while (valorPuro.length < 3) {
            valorPuro = '0' + valorPuro;
        }

        let parteInteira = valorPuro.substring(0, valorPuro.length - 2);
        let parteDecimal = valorPuro.substring(valorPuro.length - 2);

        // Remove zeros à esquerda da parte inteira, a menos que seja apenas '0'
        if (parteInteira.length > 1 && parteInteira.startsWith('0')) {
             parteInteira = parseInt(parteInteira, 10).toString();
        }

        // Adiciona pontos como separador de milhar
        parteInteira = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        evento.target.value = parteInteira + ',' + parteDecimal;
    });

    campoInput.addEventListener('focus', function(evento) {
        // Se o campo estiver vazio ao focar, inicializa com '0,00'
        if (evento.target.value === '') {
            evento.target.value = '0,00';
        }
    });

    campoInput.addEventListener('blur', function(evento) {
        // Se o campo estiver vazio ou apenas com ',' ao desfocar, define como '0,00'
        if (evento.target.value === '' || evento.target.value === ',') {
            evento.target.value = '0,00';
        }
    });
}

/**
 * Configura a lógica para mostrar/esconder um campo de input de "nova categoria"
 * baseado na seleção de um dropdown de categorias.
 * @param {HTMLSelectElement} campoSelect O elemento select HTML de categorias.
 * @param {HTMLInputElement} campoInputNome O elemento input HTML para o nome da nova categoria.
 * @param {string} novaCategoriaValor O valor da opção no select que indica "nova categoria" (ex: 'nova_categoria').
 */
export function configurarGerenciamentoDeCategoria(campoSelect, campoInputNome, novaCategoriaValor) {
    if (!campoSelect || !campoInputNome) return; // Garante que ambos os elementos existam

    campoSelect.addEventListener('change', function() {
        if (this.value === novaCategoriaValor) {
            campoInputNome.style.display = 'block';
            campoInputNome.setAttribute('required', 'required'); // Torna o campo de nova categoria obrigatório
            campoInputNome.focus(); // Foca no campo para digitação imediata
        } else {
            campoInputNome.style.display = 'none';
            campoInputNome.removeAttribute('required'); // Remove a obrigatoriedade
            campoInputNome.value = ''; // Limpa o valor
        }
    });

    // Garante que o campo de nova categoria esteja oculto ao carregar a página, se não for a opção selecionada
    if (campoSelect.value !== novaCategoriaValor) {
        campoInputNome.style.display = 'none';
    }
}

/**
 * Configura as mensagens flash para desaparecerem automaticamente após um tempo.
 * @param {NodeListOf<HTMLElement>} mensagensFlash Uma NodeList de elementos de mensagem.
 */
export function configurarMensagensFlash(mensagensFlash) {
    if (mensagensFlash) {
        mensagensFlash.forEach(function(mensagem) {
            setTimeout(function() {
                mensagem.remove();
            }, 5000); // Mensagem some após 5 segundos
        });
    }
}