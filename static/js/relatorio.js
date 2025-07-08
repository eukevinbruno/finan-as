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
    // const todasAsTransacoes = ...;
    // const tipoRelatorioInicial = ...;

    function Formatar_data_para_exibicao(data_iso) {
        const partes = data_iso.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function Renderizar_transacoes(transacoes_para_exibir) {
        listaTransacoesRelatorio.innerHTML = '';

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
            const dataFormatada = Formatar_data_para_exibicao(transacao.data);
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
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        const transacoesDoMes = todasAsTransacoes.filter(transacao => {
            const dataTransacao = new Date(transacao.data);
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

    btMesAtual.addEventListener('click', Filtrar_por_mes_atual);
    btTodasTransacoes.addEventListener('click', Mostrar_todas_as_transacoes);

    if (tipoRelatorioInicial === 'todos') {
        Mostrar_todas_as_transacoes();
    } else if (tipoRelatorioInicial === 'entradas' || tipoRelatorioInicial === 'gastos') {
        Filtrar_por_mes_atual();
    } else {
        Filtrar_por_mes_atual();
    }
});