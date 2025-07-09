// =====================
// Funções de Interatividade da Página de Nova Transação (nova_transacao.html)
// =====================

document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos HTML - Transações (específicos desta página)
    const campoDeValorTransacao = document.getElementById('valor_transacao');
    const campoDeCategoriaExistente = document.getElementById('categoria_existente');
    const campoDeNovaCategoriaNome = document.getElementById('nova_categoria_nome');
    const mensagensFlash = document.querySelectorAll('.mensagem');

    // Variáveis globais passadas do Flask no HTML (categoriasExistentes)


    // =====================
    // Lógica para Formatação do Campo de Valor (R$ X.XXX,XX)
    // =====================
    function configurarFormatacaoValor(campoInput) {
        if (!campoInput) return;

        campoInput.addEventListener('input', function(evento) {
            let valorPuro = evento.target.value.replace(/\D/g, '');
            if (valorPuro === '') {
                evento.target.value = '0,00';
                return;
            }

            while (valorPuro.length < 3) {
                valorPuro = '0' + valorPuro;
            }

            let parteInteira = valorPuro.substring(0, valorPuro.length - 2);
            let parteDecimal = valorPuro.substring(valorPuro.length - 2);

            if (parteInteira.length > 1 && parteInteira.startsWith('0')) {
                 parteInteira = parseInt(parteInteira, 10).toString();
            }

            parteInteira = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

            evento.target.value = parteInteira + ',' + parteDecimal;
        });

        campoInput.addEventListener('focus', function(evento) {
            if (evento.target.value === '') {
                evento.target.value = '0,00';
            }
        });

        campoInput.addEventListener('blur', function(evento) {
            if (evento.target.value === '' || evento.target.value === ',') {
                evento.target.value = '0,00';
            }
        });
    }

    configurarFormatacaoValor(campoDeValorTransacao);

    // Garante que o campo de valor inicie com 0,00
    campoDeValorTransacao.value = '0,00';


    // =====================
    // Lógica para Gerenciamento de Categoria (Select/Input) - Transações
    // =====================
    function configurarGerenciamentoDeCategoria(campoSelect, campoInputNome, novaCategoriaValor) {
        if (!campoSelect) return;

        campoSelect.addEventListener('change', function() {
            if (this.value === novaCategoriaValor) {
                campoInputNome.style.display = 'block';
                campoInputNome.setAttribute('required', 'required');
                campoInputNome.focus();
            } else {
                campoInputNome.style.display = 'none';
                campoInputNome.removeAttribute('required');
                campoInputNome.value = '';
            }
        });
    }

    configurarGerenciamentoDeCategoria(campoDeCategoriaExistente, campoDeNovaCategoriaNome, 'nova_categoria');

    // Preenche as categorias existentes no select de transações, se existirem
    if (campoDeCategoriaExistente && categoriasExistentes) {
        // Limpa as opções existentes antes de preencher, exceto a primeira "Selecione ou Crie"
        campoDeCategoriaExistente.querySelectorAll('option:not([disabled]):not([value="nova_categoria"])').forEach(option => option.remove());

        categoriasExistentes.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            // Insere antes da opção "Nova Categoria..."
            campoDeCategoriaExistente.insertBefore(option, campoDeCategoriaExistente.lastElementChild);
        });
        // Garante que a opção "Nova Categoria..." esteja sempre por último
        const novaCatOption = campoDeCategoriaExistente.querySelector('option[value="nova_categoria"]');
        if (!novaCatOption) { // Adiciona se não existir (para garantir)
            const newOption = document.createElement('option');
            newOption.value = 'nova_categoria';
            newOption.textContent = 'Nova Categoria...';
            campoDeCategoriaExistente.appendChild(newOption);
        }
    }


    // =====================
    // Lógica para Mensagens Flash (sumir automaticamente)
    // =====================
    if (mensagensFlash) {
        mensagensFlash.forEach(function(mensagem) {
            setTimeout(function() {
                mensagem.remove();
            }, 5000);
        });
    }
});