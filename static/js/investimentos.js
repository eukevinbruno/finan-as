// =====================
// Funções de Interatividade da Página de Investimentos
// =====================

import { configurarFormatacaoValor, configurarMensagensFlash } from './utils.js'; // NOVO: Importa funções utilitárias

document.addEventListener('DOMContentLoaded', function() {
    const campoValorMovimento = document.getElementById('valor_movimento_investimento');
    const btAportar = document.getElementById('bt_aportar');
    const btResgatar = document.getElementById('bt_resgatar');
    const formMovimentoInvestimento = document.getElementById('form_movimento_investimento');
    const inputTipoMovimento = document.getElementById('input_tipo_movimento');
    const mensagensFlash = document.querySelectorAll('.mensagem'); // Agora gerido por utils.js


    // =====================
    // Aplicação das Lógicas Utilitárias
    // =====================
    configurarFormatacaoValor(campoValorMovimento);
    campoValorMovimento.value = '0,00'; // Garante que o campo de valor inicie com 0,00

    configurarMensagensFlash(mensagensFlash); // Aplica a lógica de sumir mensagens


    // =====================
    // Lógica para Movimentação de Investimento (Aporte/Resgate)
    // =====================

    // Função para validar e enviar o formulário
    function processarMovimento(tipo) {
        let valor = campoValorMovimento.value;
        
        if (!valor || valor === '0,00') {
            alert('Por favor, insira um valor válido para a movimentação.');
            return false;
        }

        // Converte o valor para número para validação no frontend
        let valorNumerico = parseFloat(valor.replace('.', '').replace(',', '.'));

        // Variáveis globais passadas do Flask no HTML (saldoCaixaAtual, valorInvestidoAtual)
        // Certifique-se de que estas estão definidas no seu template HTML <script>
        if (tipo === 'aportar') {
            if (valorNumerico > saldoCaixaAtual) {
                alert(`Saldo em caixa insuficiente para aportar R$ ${valor.replace('.', ',')}. Saldo disponível: R$ ${saldoCaixaAtual.toFixed(2).replace('.', ',')}`);
                return false;
            }
        } else if (tipo === 'resgatar') {
            if (valorNumerico > valorInvestidoAtual) {
                alert(`Valor investido insuficiente para resgatar R$ ${valor.replace('.', ',')}. Valor investido: R$ ${valorInvestidoAtual.toFixed(2).replace('.', ',')}`);
                return false;
            }
        }
        
        // Define o tipo de movimento no input hidden e submete
        inputTipoMovimento.value = tipo;
        formMovimentoInvestimento.submit();
        return true;
    }

    // Adiciona event listeners aos botões
    if (btAportar) {
        btAportar.addEventListener('click', function(e) {
            e.preventDefault();
            processarMovimento('aportar');
        });
    }

    if (btResgatar) {
        btResgatar.addEventListener('click', function(e) {
            e.preventDefault();
            processarMovimento('resgatar');
        });
    }
});