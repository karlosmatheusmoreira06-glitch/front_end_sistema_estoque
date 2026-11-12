import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
    return (
        <main className="home-container">
            <header className="home-header">
                <div className="home-logo">
                    <span>GE</span>
                    <strong>Gestão de Estoque</strong>
                </div>
            </header>

            <section className="home-content">
                <span className="home-tag">BEM-VINDO</span>

                <h1>
                    Bem-vindo ao <span>nosso sistema</span>
                </h1>

                <p>
                    Acesse sua conta para continuar e aproveitar
                    todas as funcionalidades disponíveis.
                </p>

                <Link to="/login" className="home-login-button">
                    Entrar
                </Link>
            </section>

            <footer className="home-footer">
                <p>© 2026 — Todos os direitos reservados.</p>
            </footer>
        </main>
    );
};

// Forçar redeploy no Vercel - correção de estilos CSS
export default Home;