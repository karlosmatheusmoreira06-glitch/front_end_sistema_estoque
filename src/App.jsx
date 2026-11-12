import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Login from './components/Login'
import Cadastro from "./components/Cadastro";
import Usuarios from "./components/Usuario";
import Itens from "./components/Itens";
import Movimentacoes from "./components/Movimentacoes";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";

function App() {


  return (
    
    <>
    <BrowserRouter>
            <Routes>
                <Route path="/" element = {<Login/>}/>
                <Route path="/home" element={<Home />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/usuarios" element={<Usuarios/>}/>
                <Route path="/itens" element = {<Itens/>}/>
                <Route path="/movimentacoes" element ={<Movimentacoes/>}/>
                <Route path="/dashboard" element = {<Dashboard/>}/>
            </Routes>
        </BrowserRouter>
      
    </>
  )
}

export default App
