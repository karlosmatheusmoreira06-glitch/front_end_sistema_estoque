import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BotaoVoltar from "./BotaoVoltar";
import "./Itens.css"

const API_URL = "https://sistema-estoque-resourcify.onrender.com/itens";
const URL_ARQUIVOS = "https://sistema-estoque-resourcify.onrender.com";
const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5 MB

const urlDaImagem = (imagem) => {
    if (!imagem) {
        return "";
    }

    if (/^https?:\/\//i.test(imagem)) {
        return imagem;
    }

    return `${URL_ARQUIVOS}${imagem}`;
};

const Itens = () => {
    const navigate = useNavigate();

    const [itens, setItens] = useState([]);

    const [busca, setBusca] = useState("");

    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const [nome, setNome] = useState("");
    const [unidade_medida, setUnidadeMedida] = useState("");
    const [descricao, setDescricao] = useState("");
    const [link_referencia, setLinkReferencia] = useState("");

    const [estoque_minimo, setEstoqueMinimo] = useState("");

    const [foto, setFoto] = useState(null);
    const [previewFoto, setPreviewFoto] = useState("");
    const [imagemAtual, setImagemAtual] = useState("");
    const [removerFoto, setRemoverFoto] = useState(false);

    const [itemEditando, setItemEditando] = useState(null);

    const previewUrlRef = useRef("");

    const token = localStorage.getItem("token");

    // Libera a última prévia criada ao desmontar a tela.
    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    const limparPreviaFoto = () => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = "";
        }
        setPreviewFoto("");
    };

    const selecionarFoto = (e) => {
        const arquivo = e.target.files?.[0];

        if (!arquivo) {
            setFoto(null);
            limparPreviaFoto();
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            alert("Selecione um arquivo de imagem.");
            e.target.value = "";
            return;
        }

        if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
            alert("A imagem deve ter no máximo 5 MB.");
            e.target.value = "";
            return;
        }

        limparPreviaFoto();

        const url = URL.createObjectURL(arquivo);
        previewUrlRef.current = url;

        setPreviewFoto(url);
        setFoto(arquivo);
        setRemoverFoto(false);
    };

    const removerFotoSelecionada = () => {
        limparPreviaFoto();
        setFoto(null);
        setRemoverFoto(true);
    };

    const montarFormData = () => {
        const dados = new FormData();

        dados.append("nome", nome);
        dados.append("unidade_medida", unidade_medida);
        dados.append("descricao", descricao);

        if (link_referencia) {
            dados.append("link_referencia", link_referencia);
        }

        if (estoque_minimo) {
            dados.append("estoque_minimo", estoque_minimo);
        }

        if (foto) {
            dados.append("foto", foto);
        }

        if (removerFoto && !foto) {
            dados.append("remover_imagem", "true");
        }

        return dados;
    };

    const fotoVisivel = previewFoto || (removerFoto ? "" : urlDaImagem(imagemAtual));

    // ==============================
    // LISTAR ITENS
    // ==============================
    const listarItens = async () => {
        try {
            const resposta = await fetch(API_URL, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (resposta.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            if (!resposta.ok) {
                throw new Error("Erro ao listar itens");
            }

            const dados = await resposta.json();

            console.log("ITENS RECEBIDOS:", dados);

            setItens(dados);

        } catch (error) {
            console.error("Erro ao listar itens:", error);
            alert("Erro ao listar itens");
        }
    };

    // ==============================
    // CADASTRAR ITEM
    // ==============================
    const cadastrarItem = async (e) => {
        e.preventDefault();

        if (
            !nome ||
            !unidade_medida ||
            !descricao
        ) {
            alert("Preencha os campos obrigatórios");
            return;
        }

        try {
            const resposta = await fetch(API_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: montarFormData()
            });

            if (resposta.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            const dados = await resposta.json();

            if (!resposta.ok) {
                console.error(dados);
                alert(dados.mensagem || dados.mesage || "Erro ao cadastrar item");
                return;
            }

            alert("Item cadastrado com sucesso");

            limparFormulario();

            setMostrarFormulario(false);

            listarItens();

        } catch (error) {
            console.error("Erro ao cadastrar item:", error);
            alert("Erro ao cadastrar item");
        }
    };

    // ==============================
    // PREPARAR ITEM PARA EDIÇÃO
    // ==============================
    const prepararEdicao = (item) => {
        console.log("ITEM PARA EDITAR:", item);
        console.log("ID:", item.id);

        setItemEditando(item);

        setNome(item.nome);
        setUnidadeMedida(item.unidade_medida);
        setDescricao(item.descricao);
        setLinkReferencia(item.link_referencia || "");
        setEstoqueMinimo(String(item.estoque_minimo || ""));

        setFoto(null);
        limparPreviaFoto();
        setImagemAtual(item.imagem || "");
        setRemoverFoto(false);

        setMostrarFormulario(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // ==============================
    // ATUALIZAR ITEM
    // ==============================
    const atualizarItem = async (e) => {
        e.preventDefault();

        if (!itemEditando) {
            return;
        }

        console.log("ITEM EDITANDO:", itemEditando);
        console.log("ID:", itemEditando.id);

        try {
            const resposta = await fetch(
                `${API_URL}/${itemEditando.id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: montarFormData()
                }
            );

            if (resposta.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            const dados = await resposta.json();

            if (!resposta.ok) {
                console.error(dados);
                alert(dados.mensagem || dados.mesage || "Erro ao atualizar item");
                return;
            }

            alert("Item atualizado com sucesso");

            limparFormulario();

            setMostrarFormulario(false);

            listarItens();

        } catch (error) {
            console.error("Erro ao atualizar item:", error);
            alert("Erro ao atualizar item");
        }
    };

    // ==============================
    // EXCLUIR ITEM
    // ==============================
    const excluirItem = async (id) => {
        const confirmar = window.confirm(
            "Tem certeza que deseja excluir este item?"
        );

        if (!confirmar) {
            return;
        }

        try {
            const resposta = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (resposta.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            const dados = await resposta.json();

            if (!resposta.ok) {
                console.error(dados);
                alert("Erro ao excluir item");
                return;
            }

            alert("Item excluído com sucesso");

            listarItens();

        } catch (error) {
            console.error("Erro ao excluir item:", error);
            alert("Erro ao excluir item");
        }
    };

    // ==============================
    // LIMPAR FORMULÁRIO
    // ==============================
    const limparFormulario = () => {
        setNome("");
        setUnidadeMedida("");
        setDescricao("");
        setLinkReferencia("");
        setEstoqueMinimo("");
        setFoto(null);
        limparPreviaFoto();
        setImagemAtual("");
        setRemoverFoto(false);
        setItemEditando(null);
    };

    // ==============================
    // CANCELAR
    // ==============================
    const cancelarFormulario = () => {
        limparFormulario();
        setMostrarFormulario(false);
    };

    // ==============================
    // CARREGAR ITENS
    // ==============================
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const carregarItens = async () => {
            try {
                const resposta = await fetch(API_URL, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (resposta.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }

                if (!resposta.ok) {
                    throw new Error("Erro ao listar itens");
                }

                const dados = await resposta.json();

                console.log("ITENS RECEBIDOS:", dados);

                setItens(dados);

            } catch (error) {
                console.error("Erro ao listar itens:", error);
                alert("Erro ao listar itens");
            }
        };

        carregarItens();

    }, [navigate, token]);

    // ==============================
    // FILTRAR PELO NOME
    // ==============================
    const itensFiltrados = itens.filter((item) =>
        item.nome
            ?.toLowerCase()
            .includes(busca.toLowerCase())
    );

    return (
        <div className="itens-container">

            {/* =========================
                CABEÇALHO
            ========================= */}

            <div className="itens-header">

                <div>
                    <BotaoVoltar />

                    <h1>Itens</h1>

                    <p>
                        Cadastre e gerencie os itens do sistema
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => {
                        limparFormulario();
                        setMostrarFormulario(true);
                    }}
                >
                    + Cadastrar item
                </button>

            </div>

            {/* =========================
                FORMULÁRIO
            ========================= */}

            {mostrarFormulario && (

                <div className="item-form-card">

                    <h2>
                        {itemEditando
                            ? `Editando item #${itemEditando.id}`
                            : "Cadastrar novo item"}
                    </h2>

                    <form
                        onSubmit={
                            itemEditando
                                ? atualizarItem
                                : cadastrarItem
                        }
                    >

                        <div className="form-grid">

                            <div className="form-group">
                                <label>Nome *</label>

                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) =>
                                        setNome(e.target.value)
                                    }
                                    placeholder="Nome do item"
                                />
                            </div>

                            <div className="form-group">
                                <label>Unidade de medida *</label>

                                <input
                                    type="text"
                                    value={unidade_medida}
                                    onChange={(e) =>
                                        setUnidadeMedida(e.target.value)
                                    }
                                    placeholder="Ex: unidade, kg, caixa"
                                />
                            </div>

                            <div className="form-group form-group-full">
                                <p className="form-hint">
                                    A quantidade e o preço unitário são controlados
                                    pelas movimentações: a quantidade pelo saldo de
                                    entradas e saídas, e o preço pela última ENTRADA.
                                    Todo item é cadastrado com estoque 0 e preço 0.
                                </p>
                            </div>

                            <div className="form-group form-group-full">

                                <label>Descrição *</label>

                                <textarea
                                    value={descricao}
                                    onChange={(e) =>
                                        setDescricao(e.target.value)
                                    }
                                    placeholder="Descrição do item"
                                    rows="4"
                                />

                            </div>

                            <div className="form-group form-group-full">

                                <label>
                                    Link de referência
                                </label>

                                <input
                                    type="url"
                                    value={link_referencia}
                                    onChange={(e) =>
                                        setLinkReferencia(e.target.value)
                                    }
                                    placeholder="https://..."
                                />

                            </div>

                            <div className="form-group form-group-full">

                                <label>Estoque mínimo</label>

                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={estoque_minimo}
                                    onChange={(e) =>
                                        setEstoqueMinimo(e.target.value)
                                    }
                                    placeholder="0"
                                />

                                <small className="form-hint">
                                    Alerta de estoque baixo quando o
                                    quantitativo atual ficar abaixo deste valor.
                                </small>

                            </div>

                            <div className="form-group form-group-full">

                                <label>Foto do item</label>

                                <div className="foto-item-campo">

                                    <div className="foto-item-preview">
                                        {fotoVisivel ? (
                                            <img
                                                src={fotoVisivel}
                                                alt="Prévia da foto do item"
                                            />
                                        ) : (
                                            <span>Sem foto</span>
                                        )}
                                    </div>

                                    <div className="foto-item-controles">

                                        <label className="btn-secondary foto-item-botao">
                                            {fotoVisivel
                                                ? "Trocar foto"
                                                : "Escolher foto"}

                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={selecionarFoto}
                                                hidden
                                            />
                                        </label>

                                        {fotoVisivel && (
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={removerFotoSelecionada}
                                            >
                                                Remover foto
                                            </button>
                                        )}

                                        <small>
                                            JPG, PNG, WEBP ou GIF — até 5 MB.
                                        </small>

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="form-buttons">

                            <button
                                type="submit"
                                className="btn-primary"
                            >
                                {itemEditando
                                    ? "Atualizar item"
                                    : "Cadastrar item"}
                            </button>

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={cancelarFormulario}
                            >
                                Cancelar
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* =========================
                BUSCA
            ========================= */}

            <div className="buscar-card">

                <h2>Buscar item</h2>

                <div className="buscar-area">

                    <input
                        type="text"
                        value={busca}
                        onChange={(e) =>
                            setBusca(e.target.value)
                        }
                        placeholder="Digite o nome do item"
                    />

                    <button
                        className="btn-secondary"
                        onClick={() => setBusca("")}
                    >
                        Limpar
                    </button>

                </div>

            </div>

            {/* =========================
                LISTA DE ITENS
            ========================= */}

            <div className="lista-card">

                <div className="lista-header">

                    <div>

                        <h2>Lista de itens</h2>

                        <span>
                            {itensFiltrados.length}{" "}
                            {itensFiltrados.length === 1
                                ? "item"
                                : "itens"}
                        </span>

                    </div>

                    <button
                        className="btn-secondary"
                        onClick={listarItens}
                    >
                        Atualizar lista
                    </button>

                </div>

                {itensFiltrados.length === 0 ? (

                    <div className="sem-itens">
                        {busca
                            ? "Nenhum item encontrado."
                            : "Nenhum item cadastrado."}
                    </div>

                ) : (

                    <div className="itens-grid">

                        {itensFiltrados.map((item) => {
                            const quantidade = Number(item.quantidade || 0);
                            const preco = Number(item.preco_unitario || 0);
                            const estoqueMinimo = Number(item.estoque_minimo || 0);
                            const status = item.status_estoque || "cheio";

                            return (
                                <article className={`item-card item-card-${status}`} key={item.id}>

                                    <div className="item-card-foto">

                                        {item.imagem ? (
                                            <img
                                                src={urlDaImagem(item.imagem)}
                                                alt={`Foto de ${item.nome}`}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="item-card-sem-foto">
                                                <span>Sem foto</span>
                                            </div>
                                        )}

                                        <span className="item-card-id">
                                            #{item.id}
                                        </span>

                                        {quantidade <= 0 && (
                                            <span className="item-card-sem-estoque">
                                                Sem estoque
                                            </span>
                                        )}

                                        {status === "repor_urgente" && (
                                            <span className="item-card-tag-urgente">
                                                Repor urgente
                                            </span>
                                        )}
                                        {status === "atencao" && (
                                            <span className="item-card-tag-atencao">
                                                Atenção
                                            </span>
                                        )}

                                    </div>

                                    <div className="item-card-conteudo">

                                        <h3>{item.nome}</h3>

                                        <p className="item-card-descricao">
                                            {item.descricao || "Sem descrição."}
                                        </p>

                                        <dl className="item-card-info">

                                            <div>
                                                <dt>Quantidade</dt>
                                                <dd className={`item-card-quantidade-${status}`}>
                                                    {quantidade.toLocaleString(
                                                        "pt-BR"
                                                    )}{" "}
                                                    {item.unidade_medida}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt>Preço unitário</dt>
                                                <dd>
                                                    R$ {preco.toFixed(2)}
                                                </dd>
                                            </div>

                                            {estoqueMinimo > 0 && (
                                                <div>
                                                    <dt>Estoque mínimo</dt>
                                                    <dd>
                                                        {estoqueMinimo.toLocaleString(
                                                            "pt-BR"
                                                        )}{" "}
                                                        {item.unidade_medida}
                                                    </dd>
                                                </div>
                                            )}

                                            <div>
                                                <dt>Valor em estoque</dt>
                                                    <dd>
                                                        R${" "}
                                                        {(
                                                            quantidade * preco
                                                        ).toFixed(2)}
                                                    </dd>
                                                </div>

                                        </dl>

                                        <div className="item-card-rodape">

                                            {item.link_referencia ? (
                                                <a
                                                    href={item.link_referencia}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Referência
                                                </a>
                                            ) : (
                                                <span className="item-card-sem-link">
                                                    Sem referência
                                                </span>
                                            )}

                                            <div className="item-card-acoes">

                                                <button
                                                    className="btn-edit"
                                                    onClick={() =>
                                                        prepararEdicao(item)
                                                    }
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    className="btn-delete"
                                                    onClick={() =>
                                                        excluirItem(item.id)
                                                    }
                                                >
                                                    Excluir
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                </article>
                            );
                        })}

                    </div>

                )}

            </div>

        </div>
    );
};

export default Itens;