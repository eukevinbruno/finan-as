// =====================
// Funções de Interatividade do Formulário e Gráfico (index.html)
// =====================

document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos HTML - Transações
    const campoDeValorTransacao = document.getElementById('valor_transacao');
    const campoDeCategoriaExistente = document.getElementById('categoria_existente');
    const campoDeNovaCategoriaNome = document.getElementById('nova_categoria_nome');
    const campoDeDataTransacao = document.getElementById('data_transacao');
    const mensagensFlash = document.querySelectorAll('.mensagem');

    // Referências aos elementos HTML - Gastos Fixos (AJUSTADO: Re-adicionadas as variáveis)
    const campoDeValorProgramadoGastoFixo = document.getElementById('valor_programado'); // RE-ADICIONADO
    const campoDeValorAproximadoGastoFixo = document.getElementById('valor_aproximado'); // RE-ADICIONADO
    const acaoGastosFixosToggle = document.getElementById('acao_gastos_fixos_toggle');
    const secaoGastosFixos = document.getElementById('secao_gastos_fixos');


    // =====================
    // Lógica para Formatação do Campo de Valor (R$ X.XXX,XX)
    // =====================
    function configurarFormatacaoValor(campoInput) {
        if (!campoInput) return; // Garante que o input existe antes de configurar

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
    configurarFormatacaoValor(campoDeValorProgramadoGastoFixo);
    if (campoDeValorAproximadoGastoFixo) { // Verificação é importante caso o campo seja opcional no HTML
        configurarFormatacaoValor(campoDeValorAproximadoGastoFixo);
    }


    // =====================
    // Lógica para Campo de Data (padrão atual)
    // =====================
    // Este campo já vem preenchido do Flask com a data atual ISO

    // =====================
    // Lógica para Gerenciamento de Categoria (Select/Input) - Transações e Gastos Fixos
    // =====================
    function configurarGerenciamentoDeCategoria(campoSelect, campoInputNome, novaCategoriaValor) {
        if (!campoSelect) return; // Garante que o select existe antes de configurar

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

    configurarGerenciamentoDeCategoria(campoDeCategoriaExistente, document.getElementById('nova_categoria_nome'), 'nova_categoria');
    configurarGerenciamentoDeCategoria(document.getElementById('categoria_gasto_fixo_existente'), document.getElementById('nova_categoria_gasto_fixo_nome'), 'nova_categoria_gasto_fixo');


    // Preenche as categorias existentes no select de gastos fixos
    const campoDeCategoriaGastoFixoExistente = document.getElementById('categoria_gasto_fixo_existente'); // Re-declarar se necessário no escopo local
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
    if (mensagensFlash) {
        mensagensFlash.forEach(function(mensagem) {
            setTimeout(function() {
                mensagem.remove();
            }, 5000);
        });
    }

    // =====================
    // Lógica para Exibir/Ocultar Seção de Gastos Fixos (Toggle) (AJUSTADO)
    // =====================
    if (acaoGastosFixosToggle && secaoGastosFixos) { // Verifica se os elementos existem
        acaoGastosFixosToggle.addEventListener('click', function(e) {
            e.preventDefault(); // Previne o comportamento padrão do link

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
    if (ctx) { // Verifica se o canvas existe na página
        console.log('Dados do Gráfico:');
        console.log('Entradas Mensal:', totalEntradasMensal);
        console.log('Gastos Mensal:', totalGastosMensal);
        console.log('Valor Investido Total:', valorInvestidoTotal);

        const totalParaGrafico = totalEntradasMensal + totalGastosMensal + valorInvestidoTotal;

        let percentualEntradas = 0;
        let percentualGastos = 0;
        let percentualInvestido = 0;

        const corEntrada = getComputedStyle(document.documentElement).getPropertyValue('--cor-grafico-entrada').trim();
        const corGasto = getComputedStyle(document.documentElement).getPropertyValue('--cor-grafico-gasto').trim();
        const corInvestimento = getComputedStyle(document.documentElement).getPropertyValue('--cor-grafico-investimento').trim();

        if (totalParaGrafico > 0) {
            percentualEntradas = (totalEntradasMensal / totalParaGrafico) * 100;
            percentualGastos = (totalGastosMensal / totalParaGrafico) * 100;
            percentualInvestido = (valorInvestidoTotal / totalParaGrafico) * 100;
        }

        const dataGrafico = [];
        const coresGrafico = [];
        const labelsGrafico = [];

        // Adiciona os dados ao gráfico apenas se o percentual for maior que 0
        // Ordem: Gastos, Entradas, Investimentos
        if (percentualGastos > 0) {
            dataGrafico.push(percentualGastos);
            coresGrafico.push(corGasto);
            labelsGrafico.push('Gastos');
        }
        if (percentualEntradas > 0) {
            dataGrafico.push(percentualEntradas);
            coresGrafico.push(corEntrada);
            labelsGrafico.push('Entradas');
        }
        if (percentualInvestido > 0) {
            dataGrafico.push(percentualInvestido);
            coresGrafico.push(corInvestimento);
            labelsGrafico.push('Investimentos');
        }

        console.log('Data Gráfico:', dataGrafico);
        console.log('Length Gráfico:', dataGrafico.length);

        if (dataGrafico.length === 0) {
            // Se não houver dados, exibe uma mensagem
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