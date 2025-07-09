// =====================
// Funções de Interatividade do Formulário e Gráfico (index.html)
// =====================

import { configurarFormatacaoValor, configurarGerenciamentoDeCategoria, configurarMensagensFlash } from './utils.js'; // NOVO: Importa funções utilitárias

document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos HTML - Transações
    const campoDeValorTransacao = document.getElementById('valor_transacao');
    const campoDeCategoriaExistente = document.getElementById('categoria_existente');
    const campoDeNovaCategoriaNome = document.getElementById('nova_categoria_nome');
    // REMOVIDO: campoDeDataTransacao (não é usado neste script)
    const mensagensFlash = document.querySelectorAll('.mensagem'); // Agora gerido por utils.js


    // Referências aos elementos HTML - Gastos Fixos
    const campoDeValorProgramadoGastoFixo = document.getElementById('valor_programado');
    const campoDeValorAproximadoGastoFixo = document.getElementById('valor_aproximado');
    const acaoGastosFixosToggle = document.getElementById('acao_gastos_fixos_toggle');
    const secaoGastosFixos = document.getElementById('secao_gastos_fixos');


    // =====================
    // Aplicação das Lógicas Utilitárias
    // =====================
    configurarFormatacaoValor(campoDeValorTransacao);
    configurarFormatacaoValor(campoDeValorProgramadoGastoFixo);
    if (campoDeValorAproximadoGastoFixo) {
        configurarFormatacaoValor(campoDeValorAproximadoGastoFixo);
    }

    configurarGerenciamentoDeCategoria(campoDeCategoriaExistente, campoDeNovaCategoriaNome, 'nova_categoria');
    configurarGerenciamentoDeCategoria(document.getElementById('categoria_gasto_fixo_existente'), document.getElementById('nova_categoria_gasto_fixo_nome'), 'nova_categoria_gasto_fixo');

    configurarMensagensFlash(mensagensFlash); // Aplica a lógica de sumir mensagens


    // Preenche as categorias existentes no select de gastos fixos (mantido aqui por ser específico do dashboard)
    const campoDeCategoriaGastoFixoExistente = document.getElementById('categoria_gasto_fixo_existente');
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
    // Lógica para Exibir/Ocultar Seção de Gastos Fixos (Toggle)
    // =====================
    // ATENÇÃO: Esta lógica está aqui porque o botão de toggle e a seção estão no index.html.
    // Se você mover a lista de gastos fixos para uma página separada como sugerido anteriormente,
    // esta lógica de toggle no dashboard pode ser removida e o link no dashboard apontaria
    // diretamente para a nova página de lista de gastos fixos.
    if (acaoGastosFixosToggle && secaoGastosFixos) {
        acaoGastosFixosToggle.addEventListener('click', function(e) {
            e.preventDefault();
            if (secaoGastosFixos.style.display === 'none' || secaoGastosFixos.style.display === '') {
                secaoGastosFixos.style.display = 'block';
            } else {
                secaoGastosFixos.style.display = 'none';
            }
        });
    }


    // =====================
    // Gráfico Circular de Panorama Financeiro Total (Gastos, Entradas, Investimentos)
    // =====================
    const ctx = document.getElementById('graficoCircular');
    if (ctx) {
        const totalParaGrafico = totalEntradasMensal + totalGastosMensal + valorInvestidoTotal;

        let percentualEntradas = 0;
        let percentualGastos = 0;
        let percentualInvestido = 0;

        // As variáveis de cor (corGraficoEntrada, corGraficoGasto, corGraficoInvestimento)
        // devem ser passadas como variáveis globais do seu template HTML (index.html).
        // Certifique-se de que o <script> em index.html as defina como 'const'.
        if (totalParaGrafico > 0) {
            percentualEntradas = (totalEntradasMensal / totalParaGrafico) * 100;
            percentualGastos = (totalGastosMensal / totalParaGrafico) * 100;
            percentualInvestido = (valorInvestidoTotal / totalParaGrafico) * 100;
        }

        const dataGrafico = [];
        const coresGrafico = [];
        const labelsGrafico = [];

        if (percentualGastos > 0) {
            dataGrafico.push(percentualGastos);
            coresGrafico.push(corGraficoGasto);
            labelsGrafico.push('Gastos');
        }
        if (percentualEntradas > 0) {
            dataGrafico.push(percentualEntradas);
            coresGrafico.push(corGraficoEntrada);
            labelsGrafico.push('Entradas');
        }
        if (percentualInvestido > 0) {
            dataGrafico.push(percentualInvestido);
            coresGrafico.push(corGraficoInvestimento);
            labelsGrafico.push('Investimentos');
        }

        if (dataGrafico.length === 0) {
            ctx.parentNode.innerHTML = '<p class="mensagem-vazia">Nenhum dado para o panorama financeiro.</p>';
        } else {
            new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labelsGrafico,
                    datasets: [{
                        data: dataGrafico,
                        backgroundColor: coresGrafico,
                        hoverOffset: 10,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    return label + context.raw.toFixed(2) + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    }
});