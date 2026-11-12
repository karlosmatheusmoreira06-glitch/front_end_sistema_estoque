import { useState } from "react";
import { Link } from "react-router-dom";
import "./Cadastro.css";

const Cadastro = () => {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senhaHash, setSenhaHash] = useState("");

    async function cadastro(e) {
        e.preventDefault();

        try {
            const resposta = await fetch("https://sistema-estoque-resourcify.onrender.com/usuarios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome: nome,
                    email: email,
                    senhaHash: senhaHash
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                alert(
                    dados.mensagem ||
                    dados.message ||
                    dados.mesage ||
                    "Não foi possível cadastrar o usuário."
                );
                return;
            }

            alert("Usuário cadastrado com sucesso!");

            setNome("");
            setEmail("");
            setSenhaHash("");

        } catch (error) {
            console.error(error);
            alert("Não foi possível conectar ao servidor.");
        }
    }

    return (
        <main className="cadastro-page">
            <section className="cadastro-card">
                <div className="cadastro-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="9" cy="8" r="4" />
                        <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
                        <path d="M19 8v6" />
                        <path d="M22 11h-6" />
                    </svg>
                </div>

                <h1>Criar conta</h1>

                <p className="cadastro-subtitulo">
                    Preencha os campos abaixo para se cadastrar.
                </p>

                <form onSubmit={cadastro} className="cadastro-form">
                    <div className="cadastro-campo">
                        <label htmlFor="nome">Nome completo</label>

                        <input
                            id="nome"
                            type="text"
                            placeholder="Digite seu nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="cadastro-campo">
                        <label htmlFor="email">E-mail</label>

                        <input
                            id="email"
                            type="email"
                            placeholder="email@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="cadastro-campo">
                        <label htmlFor="senha">Senha</label>

                        <input
                            id="senha"
                            type="password"
                            placeholder="Digite sua senha"
                            value={senhaHash}
                            onChange={(e) => setSenhaHash(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <button type="submit" className="cadastro-botao">
                        Cadastrar
                    </button>
                </form>

                <div className="cadastro-rodape">
                    <p>
                        Já possui uma conta?{" "}
                        <Link to="/login">Entrar</Link>
                    </p>
                </div>
            </section>
        </main>
    );
};

export default Cadastro;

