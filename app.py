# =====================
# Configurações Iniciais do Flask e Extensões
# =====================
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from dotenv import load_dotenv # Para carregar variáveis de ambiente

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'uma_chave_secreta_muito_segura_para_desenvolvimento')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db' # Nome do arquivo do banco de dados SQLite
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Desativa o rastreamento de modificações para otimização

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'Pagina_login' # Rota para onde o usuário será redirecionado se tentar acessar uma página protegida sem login
login_manager.login_message_category = 'info' # Categoria da mensagem flash para login

# =====================
# Modelos do Banco de Dados (ORM)
# =====================

class Usuario(db.Model, UserMixin):
    """Modelo de usuário para autenticação e relacionamento com dados financeiros."""
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nome_de_usuario = db.Column(db.String(20), unique=True, nullable=False)
    senha_hash = db.Column(db.String(128), nullable=False)
    # Relacionamentos
    transacoes = db.relationship('Transacao', backref='proprietario', lazy=True)
    gastos_fixos = db.relationship('GastoFixo', backref='proprietario', lazy=True)
    dados_financeiros = db.relationship('DadosFinanceiros', backref='proprietario', uselist=False, lazy=True)

    def __repr__(self):
        return f"Usuario('{self.nome_de_usuario}')"

    def Setar_senha(self, senha_plana):
        """Define a senha do usuário, armazenando o hash."""
        self.senha_hash = generate_password_hash(senha_plana)

    def Verificar_senha(self, senha_plana):
        """Verifica se a senha plana corresponde ao hash armazenado."""
        return check_password_hash(self.senha_hash, senha_plana)

class DadosFinanceiros(db.Model):
    """Armazena o saldo em caixa e o valor investido para cada usuário."""
    __tablename__ = 'dados_financeiros'
    id = db.Column(db.Integer, primary_key=True)
    saldo_em_caixa_total = db.Column(db.Float, default=0.0, nullable=False)
    valor_investido_total = db.Column(db.Float, default=0.0, nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), unique=True, nullable=False)

    def __repr__(self):
        return f"DadosFinanceiros(Saldo: {self.saldo_em_caixa_total}, Investido: {self.valor_investido_total})"

class Transacao(db.Model):
    """Representa uma única transação financeira (entrada ou gasto)."""
    __tablename__ = 'transacoes'
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(10), nullable=False) # 'entrada' ou 'gasto'
    valor = db.Column(db.Float, nullable=False)
    descricao = db.Column(db.String(200), nullable=True)
    categoria = db.Column(db.String(50), nullable=False)
    data_transacao = db.Column(db.Date, nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    def __repr__(self):
        return f"Transacao('{self.descricao}', {self.valor}, '{self.tipo}')"

    @property
    def eh_do_mes_atual(self):
        """Verifica se a transação pertence ao mês e ano atuais."""
        hoje = datetime.now()
        return self.data_transacao.month == hoje.month and self.data_transacao.year == hoje.year

class GastoFixo(db.Model):
    """Representa um gasto fixo mensal programado."""
    __tablename__ = 'gastos_fixos'
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(200), nullable=False)
    valor_programado = db.Column(db.Float, nullable=False)
    valor_aproximado = db.Column(db.Float, nullable=True)
    categoria = db.Column(db.String(50), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    def __repr__(self):
        return f"GastoFixo('{self.descricao}', {self.valor_programado})"

# =====================
# Configuração do Flask-Login
# =====================

@login_manager.user_loader
def Carregar_usuario(id_do_usuario):
    """Função de callback para carregar um usuário dado seu ID."""
    return Usuario.query.get(int(id_do_usuario))

# =====================
# Funções Auxiliares de Validação e Formatação
# =====================

def Validar_valor_numerico(valor_string, nome_do_campo):
    """
    Valida se uma string pode ser convertida para float e é positiva.
    Adapta a string para o formato float (ex: '1.234,56' para '1234.56').

    Parâmetros:
        valor_string (str): A string contendo o valor a ser validado.
        nome_do_campo (str): Nome do campo para mensagem de erro.

    Retorna:
        float: O valor convertido.

    Levanta:
        ValueError: Se o valor for inválido ou não positivo.
    """
    if not isinstance(valor_string, str):
        raise ValueError(f"O campo '{nome_do_campo}' deve ser uma string.")

    # Remove pontos de milhar e substitui vírgula decimal por ponto
    valor_limpo = valor_string.replace('.', '').replace(',', '.')
    try:
        valor_float = float(valor_limpo)
        if valor_float <= 0:
            raise ValueError(f"O campo '{nome_do_campo}' deve ser um número positivo.")
        return valor_float
    except ValueError:
        raise ValueError(f"O campo '{nome_do_campo}' deve ser um número válido.")

@app.template_filter('formatar_moeda')
def formatar_moeda_filter(valor):
    """Filtro Jinja para formatar um float como moeda brasileira (R$ X.XXX,XX)."""
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# =====================
# Rotas de Autenticação (Novas)
# =====================

# Na rota Pagina_registro em app.py, altere:

@app.route('/registro', methods=['GET', 'POST'])
def Pagina_registro():
    """Rota para registro de novos usuários."""
    if current_user.is_authenticated:
        return redirect(url_for('Pagina_inicial'))

    if request.method == 'POST':
        nome_de_usuario = request.form['nome_de_usuario'].strip()
        senha = request.form['senha']
        confirmar_senha = request.form['confirmar_senha']

        if not nome_de_usuario or not senha or not confirmar_senha:
            flash("Todos os campos são obrigatórios.", 'erro')
            return render_template('registro.html')

        if senha != confirmar_senha:
            flash("As senhas não coincidem.", 'erro')
            return render_template('registro.html')

        if Usuario.query.filter_by(nome_de_usuario=nome_de_usuario).first():
            flash("Nome de usuário já existe. Escolha outro.", 'erro')
            return render_template('registro.html')

        novo_usuario = Usuario(nome_de_usuario=nome_de_usuario)
        novo_usuario.Setar_senha(senha)

        # Crie a instância de DadosFinanceiros sem o argumento 'usuario'
        novos_dados_financeiros = DadosFinanceiros(
            saldo_em_caixa_total=0.0,
            valor_investido_total=0.0
        )

        # Associe o DadosFinanceiros ao novo_usuario através da relação
        novo_usuario.dados_financeiros = novos_dados_financeiros

        db.session.add(novo_usuario)
        # Não precisamos adicionar explicitamente novos_dados_financeiros separadamente,
        # pois ele será "cascateado" (adicionado automaticamente) quando novo_usuario for adicionado,
        # devido ao relacionamento definido com backref.
        # No entanto, adicioná-lo explicitamente não causa erro e é mais claro para iniciantes.
        # db.session.add(novos_dados_financeiros) # Pode ser removido

        db.session.commit()
        flash("Sua conta foi criada com sucesso! Faça login para começar.", 'sucesso')
        return redirect(url_for('Pagina_login'))
    return render_template('registro.html')

@app.route('/login', methods=['GET', 'POST'])
def Pagina_login():
    """Rota para login de usuários existentes."""
    if current_user.is_authenticated:
        return redirect(url_for('Pagina_inicial'))

    if request.method == 'POST':
        nome_de_usuario = request.form['nome_de_usuario'].strip()
        senha = request.form['senha']

        usuario = Usuario.query.filter_by(nome_de_usuario=nome_de_usuario).first()

        if usuario and usuario.Verificar_senha(senha):
            login_user(usuario)
            flash(f"Bem-vindo(a) de volta, {usuario.nome_de_usuario}!", 'sucesso')
            proxima_pagina = request.args.get('next')
            return redirect(proxima_pagina or url_for('Pagina_inicial'))
        else:
            flash("Nome de usuário ou senha inválidos.", 'erro')
    return render_template('login.html')

@app.route('/logout')
@login_required
def Sair():
    """Rota para logout do usuário."""
    logout_user()
    flash("Você foi desconectado(a).", 'info')
    return redirect(url_for('Pagina_inicial'))

# =====================
# Rotas do Flask (Existente, Adaptadas para DB e Usuário Logado)
# =====================

@app.route('/')
@login_required # Garante que o usuário esteja logado para acessar
def Pagina_inicial():
    """Rota principal que exibe o dashboard."""
    # Obter os dados financeiros do usuário logado
    dados_fin = current_user.dados_financeiros

    # Calcular totais de transações para o mês atual do usuário logado
    hoje = datetime.now()
    transacoes_mes_atual = Transacao.query.filter_by(
        usuario_id=current_user.id
    ).filter(
        db.extract('month', Transacao.data_transacao) == hoje.month,
        db.extract('year', Transacao.data_transacao) == hoje.year
    ).all()

    total_entradas_mes = sum(t.valor for t in transacoes_mes_atual if t.tipo == 'entrada')
    total_gastos_mes = sum(t.valor for t in transacoes_mes_atual if t.tipo == 'gasto')
    
    # NOVO: Calcular o saldo líquido do mês
    saldo_liquido_mensal = total_entradas_mes - total_gastos_mes

    # Saldo em caixa e investimento são obtidos dos DadosFinanceiros do usuário
    saldo_caixa = dados_fin.saldo_em_caixa_total
    valor_investido = dados_fin.valor_investido_total

    # Obter últimas transações do usuário logado (ordenadas por data)
    # A limitação para as 7 últimas transações será feita diretamente no query
    transacoes_para_exibir = Transacao.query.filter_by(
        usuario_id=current_user.id
    ).order_by(Transacao.data_transacao.desc()).limit(7).all()

    # Obter categorias existentes do usuário (únicas nas transações e gastos fixos)
    categorias_transacoes = db.session.query(Transacao.categoria).filter_by(usuario_id=current_user.id).distinct()
    categorias_gastos_fixos = db.session.query(GastoFixo.categoria).filter_by(usuario_id=current_user.id).distinct()
    categorias_existentes = sorted(list(set([c[0] for c in categorias_transacoes] + [c[0] for c in categorias_gastos_fixos])))

    data_atual_iso = datetime.now().strftime('%Y-%m-%d')
    gastos_fixos = GastoFixo.query.filter_by(usuario_id=current_user.id).all()

    return render_template(
        'index.html',
        transacoes=transacoes_para_exibir,
        total_entradas=total_entradas_mes,
        total_gastos=total_gastos_mes,
        saldo_liquido_mensal=saldo_liquido_mensal, # Passa o novo valor para o template
        saldo_caixa=saldo_caixa,
        valor_investido=valor_investido,
        categorias_existentes=categorias_existentes,
        data_atual_iso=data_atual_iso,
        gastos_fixos=gastos_fixos
    )
@app.route('/adicionar_transacao', methods=['POST'])
@login_required
def Adicionar_nova_transacao():
    """Rota para adicionar uma nova transação via formulário POST."""
    try:
        tipo = request.form['tipo']
        valor = Validar_valor_numerico(request.form['valor'], 'Valor')
        descricao = request.form['descricao']
        data_transacao_str = request.form['data_transacao']
        data_transacao = datetime.strptime(data_transacao_str, '%Y-%m-%d').date()
        categoria = request.form['categoria_existente']

        if categoria == 'nova_categoria':
            categoria = request.form['nova_categoria_nome'].strip().capitalize()
            if not categoria:
                flash("Nome da nova categoria não pode ser vazio.", 'erro')
                return redirect(url_for('Pagina_inicial'))

        nova_transacao = Transacao(
            tipo=tipo,
            valor=valor,
            descricao=descricao,
            categoria=categoria,
            data_transacao=data_transacao,
            usuario_id=current_user.id
        )
        db.session.add(nova_transacao)

        # Atualiza o saldo em caixa do usuário
        dados_fin = current_user.dados_financeiros
        if tipo == 'entrada':
            dados_fin.saldo_em_caixa_total += valor
        elif tipo == 'gasto':
            dados_fin.saldo_em_caixa_total -= valor
        db.session.commit()

        flash("Transação adicionada com sucesso!", 'sucesso')
    except ValueError as e:
        flash(f"Falha ao adicionar transação: {e}", 'erro')
        db.session.rollback() # Reverte a sessão em caso de erro
    except Exception as e:
        flash(f"Ocorreu um erro inesperado ao adicionar transação: {e}", 'erro')
        db.session.rollback()
    return redirect(url_for('Pagina_inicial'))

@app.route('/excluir_transacao/<int:id_da_transacao>', methods=['POST'])
@login_required
def Excluir_transacao_web(id_da_transacao):
    """Rota para excluir uma transação pelo ID."""
    transacao_a_excluir = Transacao.query.filter_by(
        id=id_da_transacao, usuario_id=current_user.id
    ).first()

    if transacao_a_excluir:
        dados_fin = current_user.dados_financeiros
        # Reverte o impacto da transação no saldo em caixa
        if transacao_a_excluir.tipo == 'entrada':
            dados_fin.saldo_em_caixa_total -= transacao_a_excluir.valor
        elif transacao_a_excluir.tipo == 'gasto':
            dados_fin.saldo_em_caixa_total += transacao_a_excluir.valor

        db.session.delete(transacao_a_excluir)
        db.session.commit()
        flash(f"Transação '{transacao_a_excluir.descricao}' removida com sucesso!", 'sucesso')
    else:
        flash("Transação não encontrada ou você não tem permissão para excluí-la.", 'erro')
    return redirect(url_for('Pagina_inicial'))

@app.route('/adicionar_gasto_fixo', methods=['POST'])
@login_required
def Adicionar_novo_gasto_fixo():
    """Rota para adicionar um novo gasto fixo."""
    try:
        descricao = request.form['descricao_gasto_fixo']
        valor_programado = Validar_valor_numerico(request.form['valor_programado'], 'Valor Programado')
        categoria = request.form['categoria_gasto_fixo_existente']
        valor_aproximado_str = request.form.get('valor_aproximado')
        valor_aproximado = None

        if valor_aproximado_str:
            valor_aproximado = Validar_valor_numerico(valor_aproximado_str, 'Valor Aproximado')

        if categoria == 'nova_categoria_gasto_fixo':
            categoria = request.form['nova_categoria_gasto_fixo_nome'].strip().capitalize()
            if not categoria:
                flash("Nome da nova categoria de gasto fixo não pode ser vazio.", 'erro')
                return redirect(url_for('Pagina_inicial'))

        novo_gasto_fixo = GastoFixo(
            descricao=descricao,
            valor_programado=valor_programado,
            categoria=categoria,
            valor_aproximado=valor_aproximado,
            usuario=current_user
        )
        db.session.add(novo_gasto_fixo)
        db.session.commit()
        flash("Gasto fixo adicionado com sucesso!", 'sucesso')
    except ValueError as e:
        flash(f"Falha ao adicionar gasto fixo: {e}", 'erro')
        db.session.rollback()
    except Exception as e:
        flash(f"Ocorreu um erro inesperado ao adicionar gasto fixo: {e}", 'erro')
        db.session.rollback()
    return redirect(url_for('Pagina_inicial'))

@app.route('/excluir_gasto_fixo/<int:id_gasto_fixo>', methods=['POST'])
@login_required
def Excluir_gasto_fixo_web(id_gasto_fixo):
    """Rota para excluir um gasto fixo pelo ID."""
    gasto_fixo_a_excluir = GastoFixo.query.filter_by(
        id=id_gasto_fixo, usuario_id=current_user.id
    ).first()

    if gasto_fixo_a_excluir:
        db.session.delete(gasto_fixo_a_excluir)
        db.session.commit()
        flash(f"Gasto fixo '{gasto_fixo_a_excluir.descricao}' removido com sucesso!", 'sucesso')
    else:
        flash("Gasto fixo não encontrado ou você não tem permissão para excluí-lo.", 'erro')
    return redirect(url_for('Pagina_inicial'))

@app.route('/investimentos')
@login_required
def Pagina_investimentos():
    """Rota para exibir e gerenciar investimentos."""
    dados_fin = current_user.dados_financeiros
    saldo_caixa = dados_fin.saldo_em_caixa_total
    valor_investido = dados_fin.valor_investido_total

    return render_template(
        'investimentos.html',
        saldo_caixa=saldo_caixa,
        valor_investido=valor_investido
    )

@app.route('/movimentar_investimento', methods=['POST'])
@login_required
def Movimentar_investimento():
    """Rota para processar aportes e resgates de investimento."""
    tipo_movimento = request.form['tipo_movimento']
    dados_fin = current_user.dados_financeiros

    try:
        valor_movimento = Validar_valor_numerico(request.form['valor_movimento'], 'Valor da Movimentação')

        if tipo_movimento == 'aportar':
            if dados_fin.saldo_em_caixa_total < valor_movimento:
                flash("Saldo em caixa insuficiente para este aporte.", 'erro')
                return redirect(url_for('Pagina_investimentos'))
            dados_fin.saldo_em_caixa_total -= valor_movimento
            dados_fin.valor_investido_total += valor_movimento
            flash(f"R$ {valor_movimento:,.2f} aportados com sucesso no investimento!".replace(",", "X").replace(".", ",").replace("X", "."), 'sucesso')
        elif tipo_movimento == 'resgatar':
            if dados_fin.valor_investido_total < valor_movimento:
                flash("Valor investido insuficiente para este resgate.", 'erro')
                return redirect(url_for('Pagina_investimentos'))
            dados_fin.valor_investido_total -= valor_movimento
            dados_fin.saldo_em_caixa_total += valor_movimento
            flash(f"R$ {valor_movimento:,.2f} resgatados com sucesso do investimento!".replace(",", "X").replace(".", ",").replace("X", "."), 'sucesso')
        else:
            flash("Tipo de movimento inválido.", 'erro')
            return redirect(url_for('Pagina_investimentos'))

        db.session.commit()

    except ValueError as e:
        flash(f"Falha na movimentação: {e}", 'erro')
        db.session.rollback()
    except Exception as e:
        flash(f"Ocorreu um erro inesperado na movimentação: {e}", 'erro')
        db.session.rollback()
    return redirect(url_for('Pagina_investimentos'))


@app.route('/relatorio_detalhado/<tipo_relatorio>')
@login_required
def Relatorio_detalhado(tipo_relatorio):
    """Rota para exibir relatórios detalhados de entradas ou gastos por categoria."""
    # Obter todas as transações do usuário logado
    todas_as_transacoes_obj = Transacao.query.filter_by(usuario_id=current_user.id).order_by(Transacao.data_transacao.desc()).all()
    # Converte para um formato compatível com o JavaScript (lista de dicionários)
    todas_as_transacoes_para_js = [
        {
            'id': t.id,
            'tipo': t.tipo,
            'valor': t.valor,
            'descricao': t.descricao,
            'categoria': t.categoria,
            'data': t.data_transacao.strftime('%Y-%m-%d') # Formata a data para string ISO
        } for t in todas_as_transacoes_obj
    ]

    # Obter categorias existentes do usuário (únicas nas transações e gastos fixos)
    categorias_transacoes = db.session.query(Transacao.categoria).filter_by(usuario_id=current_user.id).distinct()
    categorias_gastos_fixos = db.session.query(GastoFixo.categoria).filter_by(usuario_id=current_user.id).distinct()
    categorias_existentes = sorted(list(set([c[0] for c in categorias_transacoes] + [c[0] for c in categorias_gastos_fixos])))


    titulo_do_relatorio = "Relatório de Transações"
    if tipo_relatorio == 'entradas':
        titulo_do_relatorio = "Relatório Detalhado de Entradas"
    elif tipo_relatorio == 'gastos':
        titulo_do_relatorio = "Relatório Detalhado de Gastos"

    return render_template(
        'relatorio.html',
        titulo=titulo_do_relatorio,
        tipo_relatorio=tipo_relatorio,
        todas_as_transacoes=todas_as_transacoes_para_js, # Passa a lista de dicionários
        categorias_existentes=categorias_existentes
    )

# =====================
# Execução Principal
# =====================
if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Cria as tabelas do banco de dados (se não existirem)
    app.run(
        host='192.168.2.222',
        port='95432',
        debug=True
            )