
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BotaoVoltar from "./BotaoVoltar";
import "./Usuario.css"

const API_URL = "https://sistema-estoque-resourcify.onrender.com/usuarios";

const Usuario = () => {
    const navigate = useNavigate();

    const [usuarios, setUsuarios] = useState([]);
    const [buscar, setBuscar] = useState("");
    const [mostrarCadastro, setMostrarCadastro] = useState(false);

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [nomeEditando, setNomeEditando] = useState("");
    const [emailEditando, setEmailEditando] = useState("");

    // Busca os usuários na API
    const buscarUsuarios = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const resposta = await fetch(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (resposta.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            const dados = await resposta.json();

            if (!resposta.ok) {
                alert(
                    dados.mensagem ||
                    dados.message ||
                    "Erro ao listar usuários."
                );
                return;
            }

            const lista = Array.isArray(dados)
                ? dados
                : dados.usuarios;

            if (!Array.isArray(lista)) {
                console.error("Formato inesperado da API:", dados);
                alert("A API não retornou uma lista válida de usuários.");
                return;
            }

            setUsuarios(lista);
        } catch (erro) {
            console.error("Erro ao buscar usuários:", erro);
            alert("Não foi possível conectar ao servidor.");
        }
    }, [navigate]);

    // Executa a busca ao abrir a página
    useEffect(() => {
        let ativo = true;

        const carregarUsuarios = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const resposta = await fetch(API_URL, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!ativo) return;

                if (resposta.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }

                const dados = await resposta.json();

                if (!ativo) return;

                if (!resposta.ok) {
                    alert(
                        dados.mensagem ||
                        dados.message ||
                        "Erro ao listar usuários."
                    );
                    return;
                }

                const lista = Array.isArray(dados)
                    ? dados
                    : dados.usuarios;

                if (!Array.isArray(lista)) {
                    console.error("Formato inesperado da API:", dados);
                    setUsuarios([]);
                    return;
                }

                setUsuarios(lista);
            } catch (erro) {
                if (ativo) {
                    console.error("Erro ao listar usuários:", erro);
                    alert("Não foi possível conectar ao servidor.");
                }
            }
        };

        carregarUsuarios();

        return () => {
            ativo = false;
        };
    }, [navigate]);

    // Cadastra um usuário
    const cadastrarUsuario = async (e) => {
        e.preventDefault();

        if (!nome.trim() || !email.trim() || !senha.trim()) {
            alert("Preencha todos os campos.");
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const resposta = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: nome.trim(),
                    email: email.trim(),
                    senhaHash: senha
                })
            });

            const dados = await resposta.json().catch(() => ({}));

            if (resposta.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            if (!resposta.ok) {
                alert(
                    dados.mensagem ||
                    dados.message ||
                    "Erro ao cadastrar usuário."
                );
                return;
            }

            alert("Usuário cadastrado com sucesso!");

            setNome("");
            setEmail("");
            setSenha("");
            setMostrarCadastro(false);

            await buscarUsuarios();
        } catch (erro) {
            console.error("Erro ao cadastrar usuário:", erro);
            alert("Não foi possível conectar ao servidor.");
        }
    };

    // Inicia a edição
    const iniciarEdicao = (usuario) => {
        setUsuarioEditando(usuario);
        setNomeEditando(usuario.nome || "");
        setEmailEditando(usuario.email || "");
        setMostrarCadastro(false);
    };

    // Atualiza um usuário
    const atualizarUsuario = async (e) => {
        e.preventDefault();

        if (!nomeEditando.trim() || !emailEditando.trim()) {
            alert("Preencha o nome e o e-mail.");
            return;
        }

        const token = localStorage.getItem("token");
        const id = usuarioEditando?.id ?? usuarioEditando?.id_usuario;

        if (id == null) {
            alert("Não foi possível identificar o usuário.");
            return;
        }

        try {
            const resposta = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: nomeEditando.trim(),
                    email: emailEditando.trim()
                })
            });

            const dados = await resposta.json().catch(() => ({}));

            if (resposta.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            if (!resposta.ok) {
                alert(
                    dados.mensagem ||
                    dados.message ||
                    "Erro ao atualizar usuário."
                );
                return;
            }

            alert("Usuário atualizado com sucesso!");

            setUsuarioEditando(null);
            setNomeEditando("");
            setEmailEditando("");

            await buscarUsuarios();
        } catch (erro) {
            console.error("Erro ao atualizar usuário:", erro);
            alert("Não foi possível conectar ao servidor.");
        }
    };

    // Exclui um usuário
    const excluirUsuario = async (usuario) => {
        const id = usuario?.id ?? usuario?.id_usuario;

        if (id == null) {
            alert("Não foi possível identificar o usuário.");
            return;
        }

        if (!window.confirm(`Deseja excluir o usuário ${usuario.nome}?`)) {
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const resposta = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const dados = await resposta.json().catch(() => ({}));

            if (resposta.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            if (!resposta.ok) {
                alert(
                    dados.mensagem ||
                    dados.message ||
                    "Erro ao excluir usuário."
                );
                return;
            }

            alert("Usuário excluído com sucesso!");

            await buscarUsuarios();
        } catch (erro) {
            console.error("Erro ao excluir usuário:", erro);
            alert("Não foi possível conectar ao servidor.");
        }
    };

    // Sai do sistema
    const sair = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    // Filtra usuários por nome ou e-mail
    const usuariosFiltrados = usuarios.filter((usuario) => {
        const termo = buscar.toLowerCase();

        return (
            (usuario.nome || "").toLowerCase().includes(termo) ||
            (usuario.email || "").toLowerCase().includes(termo)
        );
    });

    return (
        <div className="usuarios-container">
            <header className="usuarios-header">
                <div>
                    <BotaoVoltar />

                    <h1>Usuários</h1>
                    <p>Gerencie os usuários do sistema.</p>
                </div>

                <button
                    type="button"
                    className="btn-sair"
                    onClick={sair}
                >
                    Sair
                </button>
            </header>

            <section className="usuarios-toolbar">
                <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                />

                <button
                    type="button"
                    className="btn-cadastrar"
                    onClick={() => {
                        setMostrarCadastro(!mostrarCadastro);
                        setUsuarioEditando(null);
                    }}
                >
                    {mostrarCadastro ? "Cancelar" : "Cadastrar usuário"}
                </button>
            </section>

            {mostrarCadastro && (
                <section className="usuarios-card">
                    <h2>Novo usuário</h2>

                    <form onSubmit={cadastrarUsuario}>
                        <div className="usuarios-form-grid">
                            <div className="usuarios-form-group">
                                <label htmlFor="nome">Nome</label>
                                <input
                                    id="nome"
                                    type="text"
                                    placeholder="Nome completo"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="usuarios-form-group">
                                <label htmlFor="email">E-mail</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="usuarios-form-group">
                                <label htmlFor="senha">Senha</label>
                                <input
                                    id="senha"
                                    type="password"
                                    placeholder="Digite uma senha"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-cadastrar">
                            Salvar usuário
                        </button>
                    </form>
                </section>
            )}

            {usuarioEditando && (
                <section className="usuarios-card">
                    <h2>Editar usuário</h2>

                    <form onSubmit={atualizarUsuario}>
                        <div className="usuarios-form-grid">
                            <div className="usuarios-form-group">
                                <label htmlFor="nomeEditando">Nome</label>
                                <input
                                    id="nomeEditando"
                                    type="text"
                                    value={nomeEditando}
                                    onChange={(e) =>
                                        setNomeEditando(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="usuarios-form-group">
                                <label htmlFor="emailEditando">E-mail</label>
                                <input
                                    id="emailEditando"
                                    type="email"
                                    value={emailEditando}
                                    onChange={(e) =>
                                        setEmailEditando(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="usuarios-form-actions">
                            <button type="submit" className="btn-cadastrar">
                                Salvar alterações
                            </button>

                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={() => setUsuarioEditando(null)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="usuarios-card">
                <div className="usuarios-lista-header">
                    <h2>Lista de usuários</h2>
                    <span>{usuariosFiltrados.length} usuário(s)</span>
                </div>

                {usuariosFiltrados.length === 0 ? (
                    <div className="usuarios-vazio">
                        Nenhum usuário encontrado.
                    </div>
                ) : (
                    <div className="usuarios-tabela-container">
                        <table className="usuarios-tabela">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {usuariosFiltrados.map((usuario) => (
                                    <tr
                                        key={
                                            usuario.id ??
                                            usuario.id_usuario ??
                                            usuario.email
                                        }
                                    >
                                        <td>{usuario.nome}</td>
                                        <td>{usuario.email}</td>
                                        <td>
                                            <div className="usuarios-acoes">
                                                <button
                                                    type="button"
                                                    className="btn-editar"
                                                    onClick={() =>
                                                        iniciarEdicao(usuario)
                                                    }
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn-excluir"
                                                    onClick={() =>
                                                        excluirUsuario(usuario)
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
            </section>
        </div>
    );
};

export default Usuario;

