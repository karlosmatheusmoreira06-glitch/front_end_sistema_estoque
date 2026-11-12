import { useEffect, useState } from "react";
import {
    Package,
    Boxes,
    Wallet,
    Users,
    ArrowDownCircle,
    ArrowUpCircle,
    AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

import CardDashboard from "./CardDashboard";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const API_URL = "https://sistema-estoque-resourcify.onrender.com/dashboard";
const ITENS_URL = "https://sistema-estoque-resourcify.onrender.com/itens";

const Dashboard = () => {
    const [dados, setDados] = useState(null);
    const [itens, setItens] = useState([]);
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem("token");
        const controlador = new AbortController();

        const buscarDados = async () => {
            if (!token) {
                setErro("Faça login para visualizar o Dashboard.");
                setCarregando(false);
                return;
            }

            try {
                const [respostaDashboard, respostaItens] = await Promise.all([
                    fetch(API_URL, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        signal: controlador.signal
                    }),
                    fetch(ITENS_URL, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        signal: controlador.signal
                    })
                ]);

                if (
                    respostaDashboard.status === 401 ||
                    respostaDashboard.status === 403 ||
                    respostaItens.status === 401 ||
                    respostaItens.status === 403
                ) {
                    throw new Error("Sua sessão expirou. Faça login novamente.");
                }

                if (!respostaDashboard.ok || !respostaItens.ok) {
                    throw new Error("Não foi possível carregar o Dashboard.");
                }

                const [resultado, listaItens] = await Promise.all([
                    respostaDashboard.json(),
                    respostaItens.json()
                ]);

                setDados(resultado);
                setItens(Array.isArray(listaItens) ? listaItens : []);
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Erro ao buscar Dashboard:", error);
                    setErro(error.message || "Erro ao carregar os indicadores.");
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCarregando(false);
                }
            }
        };

        buscarDados();

        return () => controlador.abort();
    }, []);

    const formatarMoeda = (valor) =>
        Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    if (carregando) {
        return (
            <div className="dashboard-mensagem">
                Carregando indicadores...
            </div>
        );
    }

    if (erro) {
        return (
            <div className="dashboard-erro">
                <AlertCircle size={22} />
                <p>{erro}</p>
            </div>
        );
    }
    const sair = () => {
    localStorage.removeItem("token");
    navigate("/login");
};

    const cards = [
        {
            titulo: "Itens cadastrados",
            valor: dados.totalitens,
            icone: Package,
            cor: "#2563eb"
        },
        {
            titulo: "Quantidade em estoque",
            valor: Number(dados.quantidadeEstoque || 0).toLocaleString("pt-BR"),
            icone: Boxes,
            cor: "#059669"
        },
        {
            titulo: "Valor total do estoque",
            valor: formatarMoeda(dados.valorTotalEstoque),
            icone: Wallet,
            cor: "#7c3aed"
        },
        {
            titulo: "Usuários cadastrados",
            valor: dados.usuariosCadastrados,
            icone: Users,
            cor: "#d97706"
        },
        {
            titulo: "Entradas registradas",
            valor: dados.totalEntradas,
            icone: ArrowDownCircle,
            cor: "#16a34a"
        },
        {
            titulo: "Saídas registradas",
            valor: dados.totalSaidas,
            icone: ArrowUpCircle,
            cor: "#dc2626"
        }
    ];

    const itensFiltrados = [...itens]
        .filter((item) =>
            String(item.nome || "")
                .toLowerCase()
                .includes(String(busca).toLowerCase())
        )
        .sort((a, b) =>
            String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
        );

    return (
        <div className="dashboard-layout">
    <main className="dashboard-container">
        <header className="dashboard-cabecalho">
            <div>
                <h1>Dashboard</h1>
                <p>Acompanhe os indicadores do seu estoque.</p>
            </div>

        <button
            type="button"
            className="botao-logout"
            onClick={sair}
        >
            Sair
        </button>
    </header>

    <section className="dashboard-cards">
        {cards.map((card) => (
            <CardDashboard
                key={card.titulo}
                titulo={card.titulo}
                valor={card.valor}
                icone={card.icone}
                cor={card.cor}
            />
        ))}
    </section>

    <section className="dashboard-resumo">
        <h2>Resumo do estoque</h2>

        <div className="dashboard-resumo-conteudo">
            <div>
                <span>Valor total do estoque</span>
                <strong>{formatarMoeda(dados.valorTotalEstoque)}</strong>
            </div>

            <div>
                <span>Soma dos preços unitários</span>
                <strong>{formatarMoeda(dados.somaPrecoUnitario)}</strong>
            </div>
        </div>
    </section>

    <section className="dashboard-itens">
        <div className="dashboard-itens-cabecalho">
            <div>
                <h2>Itens em estoque</h2>
                <span>
                    {itensFiltrados.length}{" "}
                    {itensFiltrados.length === 1
                        ? "item cadastrado"
                        : "itens cadastrados"}
                </span>
            </div>

            <div className="dashboard-busca">
                <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar item..."
                />
            </div>

            <Link to="/itens" className="dashboard-itens-link">
                Gerenciar itens
            </Link>
        </div>

        {itensFiltrados.length === 0 ? (
            <p className="dashboard-itens-vazio">
                Nenhum item cadastrado ainda.
            </p>
        ) : (
            <div className="dashboard-tabela-container">
                <table className="dashboard-tabela">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantidade</th>
                            <th>Estoque mínimo</th>
                            <th>% do mínimo</th>
                            <th>Status</th>
                            <th>Preço unitário</th>
                            <th>Valor em estoque</th>
                        </tr>
                    </thead>

                    <tbody>
                        {itensFiltrados.map((item) => {
                            const quantidade = Number(item.quantidade || 0);
                            const preco = Number(item.preco_unitario || 0);
                            const estoqueMinimo = Number(item.estoque_minimo || 0);
                            const status = item.status_estoque || "cheio";
                            const percentual = item.percentual_estoque;

                            return (
                                <tr key={item.id} className={`dashboard-item-${status}`}>
                                    <td>
                                        <strong>{item.nome}</strong>
                                        <small>{item.unidade_medida}</small>
                                    </td>

                                    <td className={`dashboard-quantidade-${status}`}>
                                        {quantidade.toLocaleString("pt-BR")}

                                        {quantidade <= 0 && (
                                            <span className="dashboard-tag-sem-estoque">
                                                Sem estoque
                                            </span>
                                        )}
                                    </td>

                                    <td>
                                        {estoqueMinimo > 0
                                            ? estoqueMinimo.toLocaleString("pt-BR")
                                            : "-"}
                                    </td>

                                    <td>
                                        {percentual !== null && percentual !== undefined
                                            ? percentual.toFixed(2) + "%"
                                            : "-"}
                                    </td>

                                    <td>
                                        <span className={`dashboard-tag-status dashboard-tag-${status}`}>
                                            {status === "repor_urgente" ? "Repor urgente"
                                                : status === "atencao" ? "Atenção"
                                                    : status === "cheio" ? "Cheio"
                                                        : "Sem mínimo"}
                                        </span>
                                    </td>

                                    <td>{formatarMoeda(preco)}</td>

                                    <td>{formatarMoeda(quantidade * preco)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
    </section>
</main>

<aside className="dashboard-menu">
    <div className="dashboard-menu-logo">
        <span>GE</span>
        <div>
            <strong>Gestão de Estoque</strong>
            <small>Painel administrativo</small>
        </div>
    </div>

    <p className="dashboard-menu-titulo">MENU PRINCIPAL</p>

    <nav className="dashboard-menu-links">
        <Link to="/dashboard" className="dashboard-link ativo">
            <span>▦</span>
            Dashboard
        </Link>

        <Link to="/usuarios" className="dashboard-link">
            <span>♙</span>
            Usuários
        </Link>

        <Link to="/itens" className="dashboard-link">
            <span>▣</span>
            Itens
        </Link>

        <Link to="/movimentacoes" className="dashboard-link">
            <span>⇄</span>
            Movimentações
        </Link>
    </nav>

    <div className="dashboard-menu-rodape">
        Sistema de Gerenciamento
    </div>
</aside>

</div>

    );
};

export default Dashboard;

