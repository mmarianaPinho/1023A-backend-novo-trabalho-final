import 'dotenv/config'
import express from 'express';
import rotasAutenticadas from './rotas/rotas-autenticadas.js';
import rotasNaoAutenticadas from './rotas/rotas-nao-autenticadas.js';
import Auth from './middleware/auth.js';
import cors from 'cors'
import produtoController from './produtos/produto.controller.js';

const app = express();
app.use(cors())
app.use(express.json());

// 1️⃣ ROTAS NÃO AUTENTICADAS (login)
app.use(rotasNaoAutenticadas);

// 2️⃣ ROTA PÚBLICA DE PRODUTOS (SEM LOGIN)
app.get("/produtos", produtoController.listar);

// 3️⃣ A PARTIR DAQUI, TUDO EXIGE TOKEN
app.use(Auth);

// 4️⃣ ROTAS AUTENTICADAS (carrinho, admin, etc.)
app.use(rotasAutenticadas);

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});