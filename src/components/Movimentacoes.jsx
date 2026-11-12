
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BotaoVoltar from "./BotaoVoltar";
import "./Movimentacoes.css";

const API_URL = "https://sistema-estoque-resourcify.onrender.com/movimentacoes";
const ITENS_URL = "https://sistema-estoque-resourcify.onrender.com/itens";

const Movimentacoes = () => {
    const navigate = useNavigate();

    const [movimentacoes, setMovimentacoes] = useState([]);
    const [itens, setItens] = useState([]);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [movimentacaoEditando, setMovimentacaoEditando] = useState(null);

    const [item_id, setItemId] = useState("");
    const [tipo, setTipo] = useState("ENTRADA");
    const [quantidade, setQuantidade] = useState("");
    const [preco_unitario, setPrecoUnitario] = useState("");
    const [observacao, setObservacao] = useState("");

    // Campo de busca por item
    const [buscaItem, setBuscaItem] = useState("");

    const token = localStorage.getItem("token");

    // ==============================
    // OBTER ID DO USUÁRIO LOGADO
    // ==============================
    const obterIdUsuarioLogado = useCallback(() => {
        try {
            if (!token) return null;

            const partesToken = token.split(".");
            if (partesToken.length !== 3) return null;

            const partePayload = partesToken[1];

            const base64 = partePayload
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            // JWT usa base64url sem padding; atob exige o padding completo.
            const base64ComPadding =
                base64 + "=".repeat((4 - (base64.length % 4)) % 4);

            const payloadDecodificado = atob(base64ComPadding);

            const payload = JSON.parse(payloadDecodificado);

            const id = payload.id ?? payload.usuario_id ?? null;

            return id !== null && Number.isFinite(Number(id))
                ? Number(id)
                : null;
        } catch (error) {
            console.error("Erro ao obter usuário do token:", error);
            return null;
        }
    }, [token]);

    // ==============================
    // TRATAR ERRO DE AUTENTICAÇÃO
    // ==============================
    const verificarAutenticacao = useCallback((resposta) => {
        if (resposta.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return true;
        }

        return false;
    }, [navigate]);

    // ==============================
    // LISTAR ITENS PARA SELEÇÃO
    // ==============================
    const listarItens = useCallback(async () => {
        try {
            const resposta = await fetch(ITENS_URL, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (verificarAutenticacao(resposta)) return;

            if (!resposta.ok) {
                throw new Error("Erro ao listar itens");
            }

            const dados = await resposta.json();
            setItens(dados);

        } catch (error) {
            console.error("Erro ao listar itens:", error);
            alert("Erro ao listar itens");
        }
    }, [token, verificarAutenticacao]);

    // ==============================
    // LISTAR MOVIMENTAÇÕES
    // ==============================
    const listarMovimentacoes = useCallback(async () => {
        try {
            const resposta = await fetch(API_URL, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (verificarAutenticacao(resposta)) return;

            if (!resposta.ok) {
                throw new Error("Erro ao listar movimentações");
            }

            const dados = await resposta.json();

            console.log("MOVIMENTAÇÕES RECEBIDAS:", dados);
            setMovimentacoes(dados);

        } catch (error) {
            console.error("Erro ao listar movimentações:", error);
            alert("Erro ao listar movimentações");
        }
    }, [token, verificarAutenticacao]);

    // ==============================
    // CADASTRAR MOVIMENTAÇÃO
    // ==============================
    const cadastrarMovimentacao = async (e) => {
        e.preventDefault();

        if (
            !item_id ||
            !quantidade ||
            Number(quantidade) <= 0 ||
            !tipo ||
            (tipo === "ENTRADA" && preco_unitario === "") ||
            !observacao.trim()
        ) {
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        const usuario_id = obterIdUsuarioLogado();

        if (!usuario_id) {
            alert("Não foi possível identificar o usuário logado. Entre novamente.");
            localStorage.removeItem("token");
            navigate("/login");
            return;
        }

        console.log("ID do usuário logado:", usuario_id);

        try {
            const resposta = await fetch(API_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    item_id: Number(item_id),
                    usuario_id,
                    quantidade: Number(quantidade),
                    tipo,
                    preco_unitario: tipo === "ENTRADA" ? Number(preco_unitario) : 0,
                    observacao: observacao.trim()
                })
            });

            if (verificarAutenticacao(resposta)) return;

            const dados = await resposta.json();

            if (!resposta.ok) {
                console.error(dados);
                alert(
                    dados.mensagem ||
                    dados.mesage ||
                    "Erro ao cadastrar movimentação"
                );
                return;
            }

            alert("Movimentação cadastrada com sucesso");

            limparFormulario();
            setMostrarFormulario(false);

            await Promise.all([
                listarMovimentacoes(),
                listarItens()
            ]);

        } catch (error) {
            console.error("Erro ao cadastrar movimentação:", error);
            alert("Erro ao cadastrar movimentação");
        }
    };

    // ==============================
    // PREPARAR MOVIMENTAÇÃO PARA EDIÇÃO
    // ==============================
    const prepararEdicao = (movimentacao) => {
        console.log("MOVIMENTAÇÃO PARA EDITAR:", movimentacao);

        setMovimentacaoEditando(movimentacao);
        setItemId(String(movimentacao.item_id));
        setTipo(movimentacao.tipo);
        setQuantidade(String(movimentacao.quantidade));
        setPrecoUnitario(
            movimentacao.preco_unitario != null
                ? String(movimentacao.preco_unitario)
                : ""
        );
        setObservacao(movimentacao.observacao || "");
        setMostrarFormulario(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // ==============================
    // ATUALIZAR MOVIMENTAÇÃO
    // ==============================
    const atualizarMovimentacao = async (e) => {
        e.preventDefault();

        if (!movimentacaoEditando) return;

        if (
            !item_id ||
            !quantidade ||
            Number(quantidade) <= 0 ||
            !tipo ||
            (tipo === "ENTRADA" && preco_unitario === "") ||
            !observacao.trim()
        ) {
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        // O back-end atual deve manter o mesmo item na edição,
        // pois a lógica de estoque foi implementada para esse caso.
        if (
            Number(item_id) !==
            Number(movimentacaoEditando.item_id)
        ) {
            alert(
                "Não é possível trocar o item de uma movimentação durante a edição."
            );
            return;
        }

        try {
            const resposta = await fetch(
                `${API_URL}/${movimentacaoEditando.id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        item_id: Number(item_id),
                        quantidade: Number(quantidade),
                        tipo,
                        preco_unitario: tipo === "ENTRADA" ? Number(preco_unitario) : 0,
                        observacao: observacao.trim()
                    })
                }
            );

            if (verificarAutenticacao(resposta)) return;

            const dados = await resposta.json();

            if (!resposta.ok) {
                console.error(dados);
                alert(
                    dados.mensagem ||
                    dados.mesage ||
                    "Erro ao atualizar movimentação"
                );
                return;
            }

            alert("Movimentação atualizada com sucesso");

            limparFormulario();
            setMostrarFormulario(false);

            await Promise.all([
                listarMovimentacoes(),
                listarItens()
            ]);

        } catch (error) {
            console.error("Erro ao atualizar movimentação:", error);
            alert("Erro ao atualizar movimentação");
        }
    };

    // ==============================
    // EXCLUIR MOVIMENTAÇÃO
    // ==============================
    const excluirMovimentacao = async (id) => {
        const confirmar = window.confirm(
            "Tem certeza que deseja excluir esta movimentação? O estoque será ajustado."
        );

        if (!confirmar) return;

        try {
            const resposta = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (verificarAutenticacao(resposta)) return;

            const dados = await resposta.json();

            if (!resposta.ok) {
                console.error(dados);
                alert(
                    dados.mensagem ||
                    dados.mesage ||
                    "Erro ao excluir movimentação"
                );
                return;
            }

            alert("Movimentação excluída com sucesso");

            if (Number(movimentacaoEditando?.id) === Number(id)) {
                limparFormulario();
                setMostrarFormulario(false);
            }

            await Promise.all([
                listarMovimentacoes(),
                listarItens()
            ]);

        } catch (error) {
            console.error("Erro ao excluir movimentação:", error);
            alert("Erro ao excluir movimentação");
        }
    };

    // ==============================
    // LIMPAR FORMULÁRIO
    // ==============================
    const limparFormulario = () => {
        setItemId("");
        setTipo("ENTRADA");
        setQuantidade("");
        setPrecoUnitario("");
        setObservacao("");
        setMovimentacaoEditando(null);
    };

    // ==============================
    // CANCELAR FORMULÁRIO
    // ==============================
    const cancelarFormulario = () => {
        limparFormulario();
        setMostrarFormulario(false);
    };

    // ==============================
    // CARREGAR DADOS
    // ==============================
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        let ativo = true;

        const carregarDados = async () => {
            try {
                const [respostaItens, respostaMovimentacoes] =
                    await Promise.all([
                        fetch(ITENS_URL, {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        }),
                        fetch(API_URL, {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        })
                    ]);

                if (!ativo) return;

                if (
                    verificarAutenticacao(respostaItens) ||
                    verificarAutenticacao(respostaMovimentacoes)
                ) {
                    return;
                }

                if (!respostaItens.ok || !respostaMovimentacoes.ok) {
                    throw new Error("Erro ao carregar os dados");
                }

                const [dadosItens, dadosMovimentacoes] = await Promise.all([
                    respostaItens.json(),
                    respostaMovimentacoes.json()
                ]);

                if (!ativo) return;

                setItens(dadosItens);
                setMovimentacoes(dadosMovimentacoes);

            } catch (error) {
                if (!ativo) return;

                console.error("Erro ao carregar dados:", error);
                alert("Erro ao carregar itens e movimentações");
            }
        };

        carregarDados();

        return () => {
            ativo = false;
        };
    }, [navigate, token, verificarAutenticacao]);

    // ==============================
    // OBTER NOME DO ITEM
    // ==============================
    const obterNomeItem = (id) => {
        const item = itens.find(
            (item) => Number(item.id) === Number(id)
        );

        return item ? item.nome : `Item ${id}`;
    };

    // ==============================
    // FILTRAR MOVIMENTAÇÕES POR ITEM
    // ==============================
    const movimentacoesFiltradas = movimentacoes.filter((movimentacao) => {
        const nomeItem = obterNomeItem(movimentacao.item_id).toLowerCase();
        const busca = buscaItem.trim().toLowerCase();

        return nomeItem.includes(busca);
    });

    // ==============================
    // RENDERIZAÇÃO
    // ==============================
    return (
        <div className="movimentacoes-container">

            {/* =========================
                CABEÇALHO
            ========================= */}
            <div className="movimentacoes-header">
                <div>
                    <BotaoVoltar />

                    <h1>Movimentações</h1>

                    <p>
                        Registre e gerencie as entradas e saídas do estoque
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        limparFormulario();
                        setMostrarFormulario(true);
                    }}
                >
                    + Nova movimentação
                </button>
            </div>

            {/* =========================
                FORMULÁRIO
            ========================= */}
            {mostrarFormulario && (
                <div className="movimentacao-form-card">
                    <h2>
                        {movimentacaoEditando
                            ? `Editando movimentação #${movimentacaoEditando.id}`
                            : "Cadastrar movimentação"}
                    </h2>

                    <form
                        onSubmit={
                            movimentacaoEditando
                                ? atualizarMovimentacao
                                : cadastrarMovimentacao
                        }
                    >
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Item *</label>

                                <select
                                    value={item_id}
                                    onChange={(e) => setItemId(e.target.value)}
                                    required
                                >
                                    <option value="">
                                        Selecione um item
                                    </option>

                                    {itens.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.nome} — Estoque: {item.quantidade} — R$ {Number(item.preco_unitario || 0).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tipo de movimentação *</label>

                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    required
                                >
                                    <option value="ENTRADA">Entrada</option>
                                    <option value="SAIDA">Saída</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Quantidade *</label>

                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={quantidade}
                                    onChange={(e) => setQuantidade(e.target.value)}
                                    placeholder="Informe a quantidade"
                                    required
                                />
                            </div>

                            {tipo === "ENTRADA" && (
                                <div className="form-group">
                                    <label>Preço unitário da entrada *</label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={preco_unitario}
                                        onChange={(e) =>
                                            setPrecoUnitario(e.target.value)
                                        }
                                        placeholder="0.00"
                                        required
                                    />

                                    <small className="movimentacao-dica">
                                        Este é o preço que o item passa a ter
                                        (última entrada define o preço).
                                    </small>
                                </div>
                            )}

                            <div className="form-group form-group-full">
                                <label>Observação *</label>

                                <textarea
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                    placeholder="Descreva a movimentação"
                                    rows="4"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button type="submit">
                                {movimentacaoEditando
                                    ? "Atualizar movimentação"
                                    : "Cadastrar movimentação"}
                            </button>

                            <button
                                type="button"
                                onClick={cancelarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* =========================
                LISTA DE MOVIMENTAÇÕES
            ========================= */}
            <div className="lista-card">
                <div className="lista-header">
                    <div>
                        <h2>Histórico de movimentações</h2>

                        <span>
                            {movimentacoesFiltradas.length} de{" "}
                            {movimentacoes.length}{" "}
                            {movimentacoes.length === 1
                                ? "movimentação"
                                : "movimentações"}
                        </span>
                    </div>

                    <div className="lista-acoes">
                        <input
                            type="text"
                            className="busca-movimentacao"
                            placeholder="Buscar por nome do item..."
                            value={buscaItem}
                            onChange={(e) => setBuscaItem(e.target.value)}
                        />

                        <button
                            type="button"
                            onClick={() => {
                                listarMovimentacoes();
                                listarItens();
                            }}
                        >
                            Atualizar lista
                        </button>
                    </div>
                </div>

                {movimentacoesFiltradas.length === 0 ? (
                    <div className="sem-movimentacoes">
                        {movimentacoes.length === 0
                            ? "Nenhuma movimentação cadastrada."
                            : "Nenhuma movimentação encontrada para esse item."}
                    </div>
                ) : (
                    <div className="tabela-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Item</th>
                                    <th>Tipo</th>
                                    <th>Quantidade</th>
                                    <th>Preço unitário</th>
                                    <th>Observação</th>
                                    <th>Data</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {movimentacoesFiltradas.map((movimentacao) => (
                                    <tr key={movimentacao.id}>
                                        <td>{movimentacao.id}</td>

                                        <td>
                                            {obterNomeItem(movimentacao.item_id)}
                                        </td>

                                        <td>{movimentacao.tipo}</td>
                                        <td>{movimentacao.quantidade}</td>
                                        <td>
                                            {movimentacao.tipo === "ENTRADA"
                                                ? `R$ ${Number(
                                                    movimentacao.preco_unitario || 0
                                                ).toFixed(2)}`
                                                : "-"}
                                        </td>
                                        <td>{movimentacao.observacao}</td>

                                        <td>
                                            {movimentacao.data_movimentacao
                                                ? new Date(
                                                    movimentacao.data_movimentacao
                                                ).toLocaleString("pt-BR")
                                                : "-"}
                                        </td>

                                        <td>
                                            <div className="movimentacao-actions">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        prepararEdicao(movimentacao)
                                                    }
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        excluirMovimentacao(
                                                            movimentacao.id
                                                        )
                                                    }
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Movimentacoes;

