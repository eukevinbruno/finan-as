# =====================
# Configurações Iniciais do Flask
# =====================
from flask import Flask, render_template, request, redirect, url_for, flash
import json
import os
from datetime import datetime

class Transacao:
    """Representa uma única transação financeira, seja ela uma entrada ou um gasto."""

    def __init__(self, tipo_de_transacao, valor_da_transacao, descricao_da_transacao, categoria_da_transacao, data_da_transacao=None):
        """
        Inicializa uma nova instância de Transacao.

        Parâmetros:
            tipo_de_transacao (str): O tipo da transação ('entrada' ou 'gasto').
            valor_da_transacao (float): O valor monetário da transação.
            descricao_da_transacao (str): Uma breve descrição da transação.
            categoria_da_transacao (str): A categoria à qual a transação pertence (ex: 'Alimentação', 'Salário').
            data_da_transacao (str, opcional): A data da transação no formato 'AAAA-MM-DD'. Se None, usa a data atual.
        """
        if tipo_de_transacao.lower() not in ['entrada', 'gasto']:
            raise ValueError("Tipo de transação inválido. Use 'entrada' ou 'gasto'.")
        if valor_da_transacao <= 0:
            raise ValueError("O valor da transação deve ser positivo.")

        self.tipo = tipo_de_transacao.lower()
        self.valor = float(valor_da_transacao)
        self.descricao = str(descricao_da_transacao)
        self.categoria = str(categoria_da_transacao).capitalize()

        if data_da_transacao:
            try:
                datetime.strptime(data_da_transacao, '%Y-%m-%d')
                self.data = data_da_transacao
            except ValueError:
                raise ValueError("Formato de data inválido. Use 'AAAA-MM-DD'.")
        else:
            self.data = datetime.now().strftime('%Y-%m-%d')

    def para_dicionario(self):
        """Converte a transação para um dicionário, útil para salvar em JSON."""
        return {
            'tipo': self.tipo,
            'valor': self.valor,
            'descricao': self.descricao,
            'categoria': self.categoria,
            'data': self.data
        }

    def eh_do_mes_atual(self):
        """Verifica se a transação pertence ao mês e ano atuais."""
        hoje = datetime.now()
        data_transacao_obj = datetime.strptime(self.data, '%Y-%m-%d')
        return data_transacao_obj.month == hoje.month and data_transacao_obj.year == hoje.year

class GastoFixo:
    """Representa um gasto fixo mensal programado."""
    def __init__(self, descricao_gasto, valor_programado, categoria_gasto, valor_aproximado=None):
        """
        Inicializa uma nova instância de GastoFixo.

        Parâmetros:
            descricao_gasto (str): Descrição do gasto fixo (ex: 'Aluguel', 'Mensalidade Academia').
            valor_programado (float): O valor exato ou base do gasto fixo.
            categoria_gasto (str): Categoria do gasto fixo.
            valor_aproximado (float, opcional): Valor aproximado para gastos variáveis.
        """
        if valor_programado <= 0:
            raise ValueError("O valor programado deve ser positivo.")
        if valor_aproximado is not None and valor_aproximado <= 0:
            raise ValueError("O valor aproximado deve ser positivo ou None.")

        self.descricao = str(descricao_gasto)
        self.valor_programado = float(valor_programado)
        self.categoria = str(categoria_gasto).capitalize()
        self.valor_aproximado = float(valor_aproximado) if valor_aproximado is not None else None

    def para_dicionario(self):
        """Converte o gasto fixo para um dicionário."""
        return {
            'descricao': self.descricao,
            'valor_programado': self.valor_programado,
            'categoria': self.categoria,
            'valor_aproximado': self.valor_aproximado
        }

class GerenciadorDeFinancas:
    """Gerencia todas as transações, categorias, gastos fixos e investimentos, com persistência de dados."""

    def __init__(self, nome_do_arquivo='dados_financas.json'):
        """Inicializa o GerenciadorDeFinancas e carrega os dados existentes."""
        self.nome_do_arquivo = nome_do_arquivo
        self.lista_de_transacoes = []
        self.lista_de_categorias = set()
        self.lista_de_gastos_fixos = []
        self.saldo_em_caixa_total = 0.0 # Alterado: saldo em caixa será persistido diretamente
        self.valor_investido_total = 0.0
        self.Carregar_dados()

    # =====================
    # Funções de Persistência de Dados
    # =====================

    def Carregar_dados(self):
        """Carrega as transações, categorias, gastos fixos e investimentos de um arquivo JSON."""
        if os.path.exists(self.nome_do_arquivo):
            try:
                with open(self.nome_do_arquivo, 'r', encoding='utf-8') as arquivo:
                    dados = json.load(arquivo)
                    # Carregar Transações
                    for transacao_dict in dados.get('transacoes', []):
                        try:
                            data_carregada = transacao_dict.get('data')
                            transacao = Transacao(
                                transacao_dict['tipo'],
                                transacao_dict['valor'],
                                transacao_dict['descricao'],
                                transacao_dict['categoria'],
                                data_da_transacao=data_carregada
                            )
                            self.lista_de_transacoes.append(transacao)
                        except KeyError as e:
                            print(f"Erro ao carregar transação (chave ausente): {e} na transação {transacao_dict}")
                        except ValueError as e:
                            print(f"Erro de validação ao carregar transação: {e} na transação {transacao_dict}")

                    # Carregar Categorias
                    for cat in dados.get('categorias', []):
                        self.lista_de_categorias.add(cat)

                    # Carregar Gastos Fixos
                    for gasto_fixo_dict in dados.get('gastos_fixos', []):
                        try:
                            gasto_fixo = GastoFixo(
                                gasto_fixo_dict['descricao'],
                                gasto_fixo_dict['valor_programado'],
                                gasto_fixo_dict['categoria'],
                                gasto_fixo_dict.get('valor_aproximado')
                            )
                            self.lista_de_gastos_fixos.append(gasto_fixo)
                        except KeyError as e:
                            print(f"Erro ao carregar gasto fixo (chave ausente): {e} no gasto fixo {gasto_fixo_dict}")
                        except ValueError as e:
                            print(f"Erro de validação ao carregar gasto fixo: {e} no gasto fixo {gasto_fixo_dict}")

                    # Carregar Saldo em Caixa e Valor Investido (Alterado)
                    self.saldo_em_caixa_total = float(dados.get('saldo_em_caixa_total', 0.0))
                    self.valor_investido_total = float(dados.get('valor_investido_total', 0.0))

            except json.JSONDecodeError:
                print(f"Erro ao decodificar JSON do arquivo {self.nome_do_arquivo}. O arquivo pode estar corrompido.")
            except Exception as e:
                print(f"Erro inesperado ao carregar dados: {e}")
        else:
            print(f"Arquivo '{self.nome_do_arquivo}' não encontrado. Iniciando com dados vazios.")


    def Salvar_dados(self):
        """Salva todos os dados (transações, categorias, gastos fixos, investimentos) em um arquivo JSON."""
        dados = {
            'transacoes': [t.para_dicionario() for t in self.lista_de_transacoes],
            'categorias': sorted(list(self.lista_de_categorias)),
            'gastos_fixos': [gf.para_dicionario() for gf in self.lista_de_gastos_fixos],
            'saldo_em_caixa_total': self.saldo_em_caixa_total, # Salva o saldo em caixa
            'valor_investido_total': self.valor_investido_total
        }
        try:
            with open(self.nome_do_arquivo, 'w', encoding='utf-8') as arquivo:
                json.dump(dados, arquivo, ensure_ascii=False, indent=4)
        except IOError as e:
            print(f"Erro de I/O ao salvar dados: {e}")
        except Exception as e:
            print(f"Erro inesperado ao salvar dados: {e}")


    # =====================
    # Funções de Gerenciamento de Transações (Impactam o saldo em caixa)
    # =====================

    def Adicionar_transacao(self, tipo, valor, descricao, categoria, data_transacao=None):
        """
        Adiciona uma nova transação à lista de transações, atualiza o saldo em caixa e salva.
        """
        try:
            nova_transacao = Transacao(tipo, valor, descricao, categoria, data_transacao)
            self.lista_de_transacoes.append(nova_transacao)
            self.lista_de_categorias.add(nova_transacao.categoria)

            # Atualiza o saldo em caixa
            if tipo == 'entrada':
                self.saldo_em_caixa_total += valor
            elif tipo == 'gasto':
                self.saldo_em_caixa_total -= valor

            self.Salvar_dados()
            return True, "Transação adicionada com sucesso!"
        except ValueError as e:
            return False, str(e)

    def Excluir_transacao(self, indice_da_transacao):
        """
        Exclui uma transação pelo seu índice, ajusta o saldo em caixa e salva.
        """
        if 0 <= indice_da_transacao < len(self.lista_de_transacoes):
            transacao_removida = self.lista_de_transacoes.pop(indice_da_transacao)
            # Reverte o impacto da transação no saldo em caixa
            if transacao_removida.tipo == 'entrada':
                self.saldo_em_caixa_total -= transacao_removida.valor
            elif transacao_removida.tipo == 'gasto':
                self.saldo_em_caixa_total += transacao_removida.valor

            self.Salvar_dados()
            return True, f"Transação '{transacao_removida.descricao}' removida com sucesso!"
        return False, "Índice de transação inválido."

    def Obter_todas_as_transacoes(self):
        """Retorna a lista completa de transações como dicionários, ordenadas por data (mais recente primeiro)."""
        transacoes_ordenadas = sorted(self.lista_de_transacoes, key=lambda t: t.data, reverse=True)
        return [t.para_dicionario() for t in transacoes_ordenadas]

    # =====================
    # Funções de Gerenciamento de Gastos Fixos
    # =====================

    def Adicionar_gasto_fixo(self, descricao, valor_programado, categoria, valor_aproximado=None):
        """Adiciona um novo gasto fixo à lista e salva."""
        try:
            novo_gasto_fixo = GastoFixo(descricao, valor_programado, categoria, valor_aproximado)
            self.lista_de_gastos_fixos.append(novo_gasto_fixo)
            self.lista_de_categorias.add(novo_gasto_fixo.categoria)
            self.Salvar_dados()
            return True, "Gasto fixo adicionado com sucesso!"
        except ValueError as e:
            return False, str(e)

    def Obter_todos_os_gastos_fixos(self):
        """Retorna a lista de gastos fixos como dicionários."""
        return [gf.para_dicionario() for gf in self.lista_de_gastos_fixos]

    def Excluir_gasto_fixo(self, indice_gasto_fixo):
        """Exclui um gasto fixo pelo seu índice na lista."""
        if 0 <= indice_gasto_fixo < len(self.lista_de_gastos_fixos):
            gasto_removido = self.lista_de_gastos_fixos.pop(indice_gasto_fixo)
            self.Salvar_dados()
            return True, f"Gasto fixo '{gasto_removido.descricao}' removido com sucesso!"
        return False, "Índice de gasto fixo inválido."

    # =====================
    # Funções de Gerenciamento de Investimentos (Alterado para Movimentação)
    # =====================

    def Obter_saldo_em_caixa(self):
        """Retorna o saldo total em caixa."""
        return self.saldo_em_caixa_total

    def Obter_valor_investido_total(self):
        """Retorna o valor total investido."""
        return self.valor_investido_total

    def Aportar_investimento(self, valor_do_aporte):
        """
        Aporta um valor do caixa para o investimento.
        Retorna (sucesso, mensagem).
        """
        try:
            valor_float = float(valor_do_aporte)
            if valor_float <= 0:
                raise ValueError("O valor do aporte deve ser positivo.")
            if self.saldo_em_caixa_total < valor_float:
                return False, "Saldo em caixa insuficiente para este aporte."

            self.saldo_em_caixa_total -= valor_float
            self.valor_investido_total += valor_float
            self.Salvar_dados()
            return True, f"R$ {valor_float:,.2f} aportados com sucesso no investimento!".replace(",", "X").replace(".", ",").replace("X", ".")
        except ValueError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Erro inesperado ao aportar investimento: {e}"

    def Resgatar_investimento(self, valor_do_resgate):
        """
        Resgata um valor do investimento para o caixa.
        Retorna (sucesso, mensagem).
        """
        try:
            valor_float = float(valor_do_resgate)
            if valor_float <= 0:
                raise ValueError("O valor do resgate deve ser positivo.")
            if self.valor_investido_total < valor_float:
                return False, "Valor investido insuficiente para este resgate."

            self.valor_investido_total -= valor_float
            self.saldo_em_caixa_total += valor_float
            self.Salvar_dados()
            return True, f"R$ {valor_float:,.2f} resgatados com sucesso do investimento!".replace(",", "X").replace(".", ",").replace("X", ".")
        except ValueError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Erro inesperado ao resgatar investimento: {e}"


    # =====================
    # Funções de Relatórios
    # =====================

    def Calcular_total_entradas(self, periodo='tudo'):
        """Calcula o total de todas as entradas para um dado período."""
        if periodo == 'mes_atual':
            return sum(t.valor for t in self.lista_de_transacoes if t.tipo == 'entrada' and t.eh_do_mes_atual())
        return sum(t.valor for t in self.lista_de_transacoes if t.tipo == 'entrada')

    def Calcular_total_gastos(self, periodo='tudo'):
        """Calcula o total de todos os gastos para um dado período."""
        if periodo == 'mes_atual':
            return sum(t.valor for t in self.lista_de_transacoes if t.tipo == 'gasto' and t.eh_do_mes_atual())
        return sum(t.valor for t in self.lista_de_transacoes if t.tipo == 'gasto')

    # Removemos Calcular_saldo_caixa() daqui, pois o saldo é mantido diretamente em self.saldo_em_caixa_total

    def Obter_entradas_por_categoria(self, periodo='tudo'):
        """Calcula o total de entradas para cada categoria para um dado período."""
        entradas_por_categoria = {}
        transacoes_filtradas = self._Filtrar_transacoes_por_periodo(periodo)
        for transacao in transacoes_filtradas:
            if transacao.tipo == 'entrada':
                entradas_por_categoria[transacao.categoria] = entradas_por_categoria.get(transacao.categoria, 0) + transacao.valor
        return entradas_por_categoria

    def Obter_gastos_por_categoria(self, periodo='tudo'):
        """Calcula o total de gastos para cada categoria para um dado período."""
        gastos_por_categoria = {}
        transacoes_filtradas = self._Filtrar_transacoes_por_periodo(periodo)
        for transacao in transacoes_filtradas:
            if transacao.tipo == 'gasto':
                gastos_por_categoria[transacao.categoria] = gastos_por_categoria.get(transacao.categoria, 0) + transacao.valor
        return gastos_por_categoria

    def _Filtrar_transacoes_por_periodo(self, periodo):
        """Função auxiliar para filtrar transações por período (mês atual, tudo)."""
        if periodo == 'mes_atual':
            return [t for t in self.lista_de_transacoes if t.eh_do_mes_atual()]
        return self.lista_de_transacoes


# =====================
# Inicialização do Flask
# =====================
app = Flask(__name__)
app.secret_key = 'uma_chave_secreta_muito_segura'
gerenciador = GerenciadorDeFinancas()

# =====================
# Filtros Jinja
# =====================

@app.template_filter('formatar_moeda')
def formatar_moeda_filter(valor):
    """Filtro Jinja para formatar um float como moeda brasileira (R$ X.XXX,XX)."""
    # Usar locale é mais robusto para internacionalização completa, mas para este caso,
    # a substituição manual é suficiente e evita problemas de setup de ambiente.
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# =====================
# Rotas do Flask
# =====================

@app.route('/')
def Pagina_inicial():
    """Rota principal que exibe o dashboard."""
    total_entradas_mes = gerenciador.Calcular_total_entradas(periodo='mes_atual')
    total_gastos_mes = gerenciador.Calcular_total_gastos(periodo='mes_atual')
    
    # Saldo em caixa e investimento são mantidos diretamente no gerenciador
    saldo_caixa = gerenciador.Obter_saldo_em_caixa()
    valor_investido = gerenciador.Obter_valor_investido_total()

    transacoes_para_exibir = gerenciador.Obter_todas_as_transacoes()
    categorias_existentes = sorted(list(gerenciador.lista_de_categorias))
    data_atual_iso = datetime.now().strftime('%Y-%m-%d')
    gastos_fixos = gerenciador.Obter_todos_os_gastos_fixos()

    return render_template(
        'index.html',
        transacoes=transacoes_para_exibir,
        total_entradas=total_entradas_mes,
        total_gastos=total_gastos_mes,
        saldo_caixa=saldo_caixa,
        valor_investido=valor_investido,
        categorias_existentes=categorias_existentes,
        data_atual_iso=data_atual_iso,
        gastos_fixos=gastos_fixos
    )

@app.route('/adicionar_transacao', methods=['POST'])
def Adicionar_nova_transacao():
    """Rota para adicionar uma nova transação via formulário POST."""
    tipo = request.form['tipo']
    valor = float(request.form['valor'].replace('.', '').replace(',', '.'))
    descricao = request.form['descricao']
    data_transacao = request.form['data_transacao']
    categoria = request.form['categoria_existente']

    if categoria == 'nova_categoria':
        categoria = request.form['nova_categoria_nome'].strip()
        if not categoria:
            flash("Nome da nova categoria não pode ser vazio.", 'erro')
            return redirect(url_for('Pagina_inicial'))

    sucesso, mensagem = gerenciador.Adicionar_transacao(tipo, valor, descricao, categoria, data_transacao)

    if sucesso:
        flash(mensagem, 'sucesso')
    else:
        flash(f"Falha ao adicionar transação: {mensagem}", 'erro')

    return redirect(url_for('Pagina_inicial'))

@app.route('/excluir_transacao/<int:indice_da_transacao>', methods=['POST'])
def Excluir_transacao_web(indice_da_transacao):
    """Rota para excluir uma transação pelo índice."""
    sucesso, mensagem = gerenciador.Excluir_transacao(indice_da_transacao)
    if sucesso:
        flash(mensagem, 'sucesso')
    else:
        flash(mensagem, 'erro')
    return redirect(url_for('Pagina_inicial'))

@app.route('/adicionar_gasto_fixo', methods=['POST'])
def Adicionar_novo_gasto_fixo():
    """Rota para adicionar um novo gasto fixo."""
    descricao = request.form['descricao_gasto_fixo']
    valor_programado = float(request.form['valor_programado'].replace('.', '').replace(',', '.'))
    categoria = request.form['categoria_gasto_fixo_existente']
    valor_aproximado = request.form.get('valor_aproximado')

    if valor_aproximado:
        valor_aproximado = float(valor_aproximado.replace('.', '').replace(',', '.'))
    else:
        valor_aproximado = None

    if categoria == 'nova_categoria_gasto_fixo':
        categoria = request.form['nova_categoria_gasto_fixo_nome'].strip()
        if not categoria:
            flash("Nome da nova categoria de gasto fixo não pode ser vazio.", 'erro')
            return redirect(url_for('Pagina_inicial'))

    sucesso, mensagem = gerenciador.Adicionar_gasto_fixo(descricao, valor_programado, categoria, valor_aproximado)

    if sucesso:
        flash(mensagem, 'sucesso')
    else:
        flash(f"Falha ao adicionar gasto fixo: {mensagem}", 'erro')

    return redirect(url_for('Pagina_inicial'))

@app.route('/excluir_gasto_fixo/<int:indice_gasto_fixo>', methods=['POST'])
def Excluir_gasto_fixo_web(indice_gasto_fixo):
    """Rota para excluir um gasto fixo pelo índice."""
    sucesso, mensagem = gerenciador.Excluir_gasto_fixo(indice_gasto_fixo)
    if sucesso:
        flash(mensagem, 'sucesso')
    else:
        flash(mensagem, 'erro')
    return redirect(url_for('Pagina_inicial'))

@app.route('/investimentos')
def Pagina_investimentos():
    """Rota para exibir e gerenciar investimentos."""
    # Estes valores serão usados pelo JavaScript na página de investimentos
    saldo_caixa = gerenciador.Obter_saldo_em_caixa()
    valor_investido = gerenciador.Obter_valor_investido_total()

    return render_template(
        'investimentos.html',
        saldo_caixa=saldo_caixa, # Passa saldo_caixa para a página de investimentos
        valor_investido=valor_investido
    )

@app.route('/movimentar_investimento', methods=['POST']) # Rota para movimentar entre caixa e investimento
def Movimentar_investimento():
    """Rota para processar aportes e resgates de investimento."""
    tipo_movimento = request.form['tipo_movimento'] # 'aportar' ou 'resgatar'
    valor_movimento = float(request.form['valor_movimento'].replace('.', '').replace(',', '.'))

    if tipo_movimento == 'aportar':
        sucesso, mensagem = gerenciador.Aportar_investimento(valor_movimento)
    elif tipo_movimento == 'resgatar':
        sucesso, mensagem = gerenciador.Resgatar_investimento(valor_movimento)
    else:
        sucesso, mensagem = False, "Tipo de movimento inválido."

    if sucesso:
        flash(mensagem, 'sucesso')
    else:
        flash(f"Falha na movimentação: {mensagem}", 'erro')

    return redirect(url_for('Pagina_investimentos'))


@app.route('/relatorio_detalhado/<tipo_relatorio>')
def Relatorio_detalhado(tipo_relatorio):
    """Rota para exibir relatórios detalhados de entradas ou gastos por categoria."""
    todas_as_transacoes = gerenciador.Obter_todas_as_transacoes()
    categorias_existentes = sorted(list(gerenciador.lista_de_categorias))

    titulo_do_relatorio = "Relatório de Transações"
    if tipo_relatorio == 'entradas':
        titulo_do_relatorio = "Relatório Detalhado de Entradas"
    elif tipo_relatorio == 'gastos':
        titulo_do_relatorio = "Relatório Detalhado de Gastos"

    return render_template(
        'relatorio.html',
        titulo=titulo_do_relatorio,
        tipo_relatorio=tipo_relatorio,
        todas_as_transacoes=json.dumps(todas_as_transacoes),
        categorias_existentes=categorias_existentes
    )

# =====================
# Execução Principal
# =====================
if __name__ == '__main__':
    app.run(debug=True)