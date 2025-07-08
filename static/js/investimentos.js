// =====================
// Funções de Interatividade da Página de Investimentos
// =====================

document.addEventListener('DOMContentLoaded', function() {
    const campoValorMovimento = document.getElementById('valor_movimento_investimento'); // Campo de valor
    const btAportar = document.getElementById('bt_aportar');
    const btResgatar = document.getElementById('bt_resgatar');
    const mensagensFlash = document.querySelectorAll('.mensagem');

    // Variáveis globais passadas do Flask
    // const saldoCaixaAtual = ...; // Ex: 1500.00
    // const valorInvestidoAtual = ...; // Ex: 500.00


    // =====================
    // Lógica para Formatação do Campo de Valor (R$ X.XXX,XX)
    // =====================
    function configurarFormatacaoValor(campoInput) {
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

    configurarFormatacaoValor(campoValorMovimento);

    // Garante que o campo de valor inicie com 0,00
    campoValorMovimento.value = '0,00';


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

    // =====================
    // Lógica para Movimentação de Investimento (Aporte/Resgate)
    // =====================

    // Função para validar e enviar o formulário
    function processarMovimento(tipo) {
        let valor = campoValorMovimento.value;
        // O valor enviado ao backend já é tratado para `float` lá.
        // Aqui, precisamos apenas garantir que não seja vazio e seja numérico.
        if (!valor || valor === '0,00') {
            alert('Por favor, insira um valor válido para a movimentação.');
            return false;
        }

        // Simulação de validação de saldo no frontend (a validação real é no backend)
        let valorNumerico = parseFloat(valor.replace('.', '').replace(',', '.'));

        if (tipo === 'aportar') {
            if (valorNumerico > saldoCaixaAtual) {
                alert(`Saldo em caixa insuficiente para aportar R$ ${valor}. Saldo disponível: R$ ${saldoCaixaAtual.toFixed(2).replace('.', ',')}`);
                return false;
            }
        } else if (tipo === 'resgatar') {
            if (valorNumerico > valorInvestidoAtual) {
                alert(`Valor investido insuficiente para resgatar R$ ${valor}. Valor investido: R$ ${valorInvestidoAtual.toFixed(2).replace('.', ',')}`);
                return false;
            }
        }
        
        // Adiciona um campo hidden ao formulário para enviar o tipo de movimento
        const form = document.getElementById('form_movimento_investimento');
        let hiddenInputTipo = document.createElement('input');
        hiddenInputTipo.type = 'hidden';
        hiddenInputTipo.name = 'tipo_movimento';
        hiddenInputTipo.value = tipo;
        form.appendChild(hiddenInputTipo);

        // Submete o formulário
        form.submit();
        return true;
    }

    // Adiciona event listeners aos botões
    if (btAportar) {
        btAportar.addEventListener('click', function(e) {
            e.preventDefault(); // Impede o envio padrão do formulário
            processarMovimento('aportar');
        });
    }

    if (btResgatar) {
        btResgatar.addEventListener('click', function(e) {
            e.preventDefault(); // Impede o envio padrão do formulário
            processarMovimento('resgatar');
        });
    }
});