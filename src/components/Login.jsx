import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css"

const Login = () => {
const [email, setEmail] = useState("");
const [senha, setSenha] = useState("");


const navigate = useNavigate();

async function entrar(e) {
    e.preventDefault();

    try {
        const resposta = await fetch(
            "https://sistema-estoque-resourcify.onrender.com/usuarios/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    senhaHash: senha
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.message || "E-mail ou senha inválidos");
            return;
        }

        localStorage.setItem("token", dados.token);

        alert("Login realizado com sucesso!");

        navigate("/dashboard");

    } catch (error) {
        console.error(error);
        alert("Servidor não iniciado");
    }
}

return (
    <div className="login-pagina">
        <div className="login-card">
            <div className="login-logo">
                <span>GE</span>
            </div>

            <h1>Bem-vindo de volta!</h1>
            <p className="login-subtitulo">
                Entre na sua conta para gerenciar seu estoque.
            </p>

            <form onSubmit={entrar}>
                <div className="login-campo">
                    <label htmlFor="email">E-mail</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="email@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="login-campo">
                    <label htmlFor="senha">Senha</label>
                    <input
                        id="senha"
                        type="password"
                        placeholder="Digite sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                    />
                </div>

                <button className="login-botao" type="submit">
                    Entrar na conta
                </button>
            </form>

            <p className="login-cadastro">
                Ainda não tem uma conta?{" "}
                <Link to="/cadastro">Cadastre-se</Link>
            </p>
        </div>

        <p className="login-rodape">
            Sistema de Gerenciamento de Estoque
        </p>
    </div>
);


};

export default Login;
