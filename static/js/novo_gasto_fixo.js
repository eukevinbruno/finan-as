// =====================
// Funções de Interatividade da Página de Novo Gasto Fixo (novo_gasto_fixo.html)
// =====================

import { configurarFormatacaoValor, configurarGerenciamentoDeCategoria, configurarMensagensFlash } from './utils.js'; // NOVO: Importa funções utilitárias

document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos HTML - Gastos Fixos (específicos desta página)
    const campoDeValorProgramadoGastoFixo = document.getElementById('valor_programado');
    const campoDeValorAproximadoGastoFixo = document.getElementById('valor_aproximado');
    const campoDeCategoriaGastoFixoExistente = document.getElementById('categoria_gasto_fixo_existente');
    const campoDeNovaCategoriaGastoFixoNome = document.getElementById('nova_categoria_gasto_fixo_nome');
    const mensagensFlash = document.querySelectorAll('.mensagem'); // Agora gerido por utils.js


    // =====================
    // Aplicação das Lógicas Utilitárias
    // =====================
    configurarFormatacaoValor(campoDeValorProgramadoGastoFixo);
    if (campoDeValorAproximadoGastoFixo) {
        configurarFormatacaoValor(campoDeValorAproximadoGastoFixo);
    }

    // Garante que os campos de valor iniciem com 0,00
    if(campoDeValorProgramadoGastoFixo) campoDeValorProgramadoGastoFixo.value = '0,00';
    if(campoDeValorAproximadoGastoFixo) campoDeValorAproximadoGastoFixo.value = '0,00';

    configurarGerenciamentoDeCategoria(campoDeCategoriaGastoFixoExistente, campoDeNovaCategoriaGastoFixoNome, 'nova_categoria_gasto_fixo');

    configurarMensagensFlash(mensagensFlash); // Aplica a lógica de sumir mensagens


    // Preenche as categorias existentes no select de gastos fixos (mantido aqui por ser específico da lógica de carregamento de categorias para novo gasto fixo)
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
});