// =====================
// Funções de Interatividade da Página de Novo Gasto Fixo (novo_gasto_fixo.html)
// =====================

document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos HTML - Gastos Fixos (específicos desta página)
    const campoDeValorProgramadoGastoFixo = document.getElementById('valor_programado');
    const campoDeValorAproximadoGastoFixo = document.getElementById('valor_aproximado');
    const campoDeCategoriaGastoFixoExistente = document.getElementById('categoria_gasto_fixo_existente');
    const campoDeNovaCategoriaGastoFixoNome = document.getElementById('nova_categoria_gasto_fixo_nome');
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

    configurarFormatacaoValor(campoDeValorProgramadoGastoFixo);
    if (campoDeValorAproximadoGastoFixo) {
        configurarFormatacaoValor(campoDeValorAproximadoGastoFixo);
    }

    // Garante que os campos de valor iniciem com 0,00
    if(campoDeValorProgramadoGastoFixo) campoDeValorProgramadoGastoFixo.value = '0,00';
    if(campoDeValorAproximadoGastoFixo) campoDeValorAproximadoGastoFixo.value = '0,00';


    // =====================
    // Lógica para Gerenciamento de Categoria (Select/Input) - Gastos Fixos
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

    configurarGerenciamentoDeCategoria(campoDeCategoriaGastoFixoExistente, campoDeNovaCategoriaGastoFixoNome, 'nova_categoria_gasto_fixo');

    // Preenche as categorias existentes no select de gastos fixos
    if (campoDeCategoriaGastoFixoExistente && categoriasExistentes) {
        campoDeCategoriaGastoFixoExistente.querySelectorAll('option:not([disabled]):not([value="nova_categoria_gasto_fixo"])').forEach(option => option.remove());

        categoriasExistentes.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            campoDeCategoriaGastoFixoExistente.insertBefore(option, campoDeCategoriaGastoFixoExistente.lastElementChild);
        });
        const novaCatOptionGastoFixo = campoDeCategoriaGastoFixoExistente.querySelector('option[value="nova_categoria_gasto_fixo"]');
        if (!novaCatOptionGastoFixo) {
            const newOption = document.createElement('option');
            newOption.value = 'nova_categoria_gasto_fixo';
            newOption.textContent = 'Nova Categoria...';
            campoDeCategoriaGastoFixoExistente.appendChild(newOption);
        }
    }


    // =====================
    // Lógica para Mensagens Flash (sumir automaticamente)
    // =====================
    if (mensagensFlash) { // Variável mensagensFlash não está definida neste escopo, seria preciso passar do Jinja
        mensagensFlash.forEach(function(mensagem) {
            setTimeout(function() {
                mensagem.remove();
            }, 5000);
        });
    }
});