import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import "./BotaoVoltar.css";

/**
 * Seta para voltar à página anterior.
 *
 * Usa o histórico do navegador. Se a página foi aberta direto (sem histórico),
 * vai para `destino`, que por padrão é o Dashboard.
 */
const BotaoVoltar = ({ destino = "/dashboard", rotulo = "Voltar" }) => {
    const navigate = useNavigate();

    const voltar = () => {
        const indice = window.history.state?.idx;

        if (typeof indice === "number" && indice > 0) {
            navigate(-1);
            return;
        }

        navigate(destino);
    };

    return (
        <button
            type="button"
            className="botao-voltar"
            onClick={voltar}
            aria-label={rotulo}
            title={rotulo}
        >
            <ArrowLeft size={16} strokeWidth={2.4} aria-hidden="true" />
            <span>{rotulo}</span>
        </button>
    );
};

export default BotaoVoltar;
