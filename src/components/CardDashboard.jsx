import "./Dashboard.css";
const CardDashboard = ({ titulo, valor, icone: Icone, cor }) => {
    return (
        <div className="card-dashboard">
            <div
                className="card-dashboard-icone"
                style={{ backgroundColor: `${cor}20`, color: cor }}
            >
                <Icone size={25} />
            </div>

            <div className="card-dashboard-info">
                <p>{titulo}</p>
                <h2>{valor}</h2>
            </div>
        </div>
    );
};

export default CardDashboard;

