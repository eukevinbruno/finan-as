// =====================
// Funções de Interatividade da Página de Nova Transação (nova_transacao.html)
// =====================

import { configurarFormatacaoValor, configurarGerenciamentoDeCategoria, configurarMensagensFlash } from './utils.js'; // NOVO: Importa funções utilitárias

document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos HTML - Transações (específicos desta página)
    const campoDeValorTransacao = document.getElementById('valor_transacao');
    const campoDeCategoriaExistente = document.getElementById('categoria_existente');
    const campoDeNovaCategoriaNome = document.getElementById('nova_categoria_nome');
    const mensagensFlash = document.querySelectorAll('.mensagem'); // Agora gerido por utils.js

    // =====================
    // Aplicação das Lógicas Utilitárias
    // =====================
    configurarFormatacaoValor(campoDeValorTransacao);
    campoDeValorTransacao.value = '0,00'; // Garante que o campo de valor inicie com 0,00

    configurarGerenciamentoDeCategoria(campoDeCategoriaExistente, campoDeNovaCategoriaNome, 'nova_categoria');

    configurarMensagensFlash(mensagensFlash); // Aplica a lógica de sumir mensagens


    // Preenche as categorias existentes no select de transações, se existirem (mantido aqui por ser específico da lógica de carregamento de categorias para nova transação)
    if (campoDeCategoriaExistente && categoriasExistentes) {
        campoDeCategoriaExistente.querySelectorAll('option:not([disabled]):not([value="nova_categoria"])').forEach(option => option.remove());

        categoriasExistentes.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            campoDeCategoriaExistente.insertBefore(option, campoDeCategoriaExistente.lastElementChild);
        });
        const novaCatOption = campoDeCategoriaExistente.querySelector('option[value="nova_categoria"]');
        if (!novaCatOption) {
            const newOption = document.createElement('option');
            newOption.value = 'nova_categoria';
            newOption.textContent = 'Nova Categoria...';
            campoDeCategoriaExistente.appendChild(newOption);
        }
    }
});