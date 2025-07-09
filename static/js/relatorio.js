// =====================
// Funções de Gerenciamento de Relatórios (relatorio.html)
// =====================

document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos HTML
    const btMesAtual = document.getElementById('bt_mes_atual');
    const btTodasTransacoes = document.getElementById('bt_todas_transacoes');
    const listaTransacoesRelatorio = document.getElementById('lista_transacoes_relatorio');
    const tituloPeriodo = document.getElementById('titulo_periodo');
    const mensagemVaziaRelatorio = document.getElementById('mensagem_vazia_relatorio');

    // Variáveis globais (definidas no HTML com Jinja)
    // const todasAsTransacoes = ...; // Já é um array de objetos com data como string 'YYYY-MM-DD'
    // const tipoRelatorioInicial = ...;
    // NOVO: totalEntradasMensal e totalGastosMensal para o gráfico do extrato

    function Formatar_data_para_exibicao(data_iso) {
        const partes = data_iso.split('-'); // Espera 'AAAA-MM-DD'
        return `${partes[2]}/${partes[1]}/${partes[0]}`; // Retorna 'DD/MM/AAAA'
    }

    function Renderizar_transacoes(transacoes_para_exibir) {
        listaTransacoesRelatorio.innerHTML = ''; // Limpa a lista existente

        let transacoes_filtradas_por_tipo = [];
        if (tipoRelatorioInicial === 'entradas') {
            transacoes_filtradas_por_tipo = transacoes_para_exibir.filter(t => t.tipo === 'entrada');
        } else if (tipoRelatorioInicial === 'gastos') {
            transacoes_filtradas_por_tipo = transacoes_para_exibir.filter(t => t.tipo === 'gasto');
        } else {
            transacoes_filtradas_por_tipo = transacoes_para_exibir;
        }

        if (transacoes_filtradas_por_tipo.length === 0) {
            mensagemVaziaRelatorio.style.display = 'block';
            return;
        } else {
            mensagemVaziaRelatorio.style.display = 'none';
        }

        // Ordena as transações por data (mais recente primeiro)
        const transacoes_ordenadas = [...transacoes_filtradas_por_tipo].sort((a, b) => {
            return new Date(b.data) - new Date(a.data);
        });

        transacoes_ordenadas.forEach(transacao => {
            const li = document.createElement('li');
            li.classList.add('item-relatorio-detalhado');
            li.classList.add(transacao.tipo);

            const sinal = transacao.tipo === 'entrada' ? '+' : '-';
            const valorFormatado = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(transacao.valor);
            const dataFormatada = Formatar_data_para_exibicao(transacao.data); // Usa a data como string 'YYYY-MM-DD'
            const descricaoExibida = transacao.descricao || "Sem descrição";

            li.innerHTML = `
                <div class="info-transacao-relatorio">
                    <span class="descricao-relatorio">${descricaoExibida}</span>
                    <span class="meta-relatorio">${transacao.categoria} - ${dataFormatada}</span>
                </div>
                <span class="valor-relatorio">${sinal} ${valorFormatado.replace('R$', '').trim()}</span>
            `;
            listaTransacoesRelatorio.appendChild(li);
        });
    }

    function Filtrar_por_mes_atual() {
        const hoje = new Date();
        const mesAtual = hoje.getMonth(); // Mês é 0-indexed
        const anoAtual = hoje.getFullYear();

        const transacoesDoMes = todasAsTransacoes.filter(transacao => {
            const dataTransacao = new Date(transacao.data); // Converte a string YYYY-MM-DD para objeto Date
            return dataTransacao.getMonth() === mesAtual && dataTransacao.getFullYear() === anoAtual;
        });
        Renderizar_transacoes(transacoesDoMes);
        const formatadorMesAno = new Intl.DateTimeFormat('pt-BR', { month: '2-digit', year: 'numeric' });
        tituloPeriodo.textContent = `Transações do Mês Atual (${formatadorMesAno.format(hoje)})`;
        btMesAtual.classList.add('ativo');
        btTodasTransacoes.classList.remove('ativo');
    }

    function Mostrar_todas_as_transacoes() {
        Renderizar_transacoes(todasAsTransacoes);
        tituloPeriodo.textContent = 'Histórico Completo de Transações';
        btTodasTransacoes.classList.add('ativo');
        btMesAtual.classList.remove('ativo');
    }

    // Adiciona os Event Listeners aos botões de filtro
    btMesAtual.addEventListener('click', Filtrar_por_mes_atual);
    btTodasTransacoes.addEventListener('click', Mostrar_todas_as_transacoes);

    // Lógica para aplicar o filtro inicial com base no tipoRelatorioInicial vindo do Flask
    if (tipoRelatorioInicial === 'todos') {
        Mostrar_todas_as_transacoes();
    } else if (['entradas', 'gastos'].includes(tipoRelatorioInicial)) {
        // Se for "entradas" ou "gastos", filtra pelo mês atual e depois pelo tipo na função Renderizar_transacoes
        Filtrar_por_mes_atual();
    } else {
        // Padrão: mostra transações do mês atual se não houver tipo específico ou tipo inválido
        Filtrar_por_mes_atual();
    }

    // =====================
    // Gráfico Circular de Balanço Mensal (agora no relatorio.js)
    // =====================
    const ctxMensal = document.getElementById('graficoCircularMensal');
    if (ctxMensal) { // Verifica se o canvas existe na página
        // totalEntradasMensal e totalGastosMensal são passadas via Jinja2 no extrato.html
        const totalMensalParaGrafico = totalEntradasMensal + totalGastosMensal;

        let percentualEntradasMensal = 0;
        let percentualGastosMensal = 0;

        const corEntrada = getComputedStyle(document.documentElement).getPropertyValue('--cor-grafico-entrada').trim();
        const corGasto = getComputedStyle(document.documentElement).getPropertyValue('--cor-grafico-gasto').trim();

        if (totalMensalParaGrafico > 0) {
            percentualEntradasMensal = (totalEntradasMensal / totalMensalParaGrafico) * 100;
            percentualGastosMensal = (totalGastosMensal / totalMensalParaGrafico) * 100;
        }

        const dataGraficoMensal = [];
        const coresGraficoMensal = [];
        const labelsGraficoMensal = [];

        if (percentualEntradasMensal > 0) {
            dataGraficoMensal.push(percentualEntradasMensal);
            coresGraficoMensal.push(corEntrada);
            labelsGraficoMensal.push('Entradas');
        }
        if (percentualGastosMensal > 0) {
            dataGraficoMensal.push(percentualGastosMensal);
            coresGraficoMensal.push(corGasto);
            labelsGraficoMensal.push('Gastos');
        }

        if (dataGraficoMensal.length === 0) {
            // Se não houver dados, exibe uma mensagem no lugar do gráfico
            // Ajusta o padding para que a mensagem não fique muito espremida
            const parentDiv = ctxMensal.parentNode;
            if (parentDiv) {
                parentDiv.innerHTML = '<p class="mensagem-vazia" style="padding: 20px;">Nenhum dado para o balanço do mês.</p>';
            }
        } else {
            new Chart(ctxMensal.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labelsGraficoMensal,
                    datasets: [{
                        data: dataGraficoMensal,
                        backgroundColor: coresGraficoMensal,
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