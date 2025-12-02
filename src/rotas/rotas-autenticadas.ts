import { Router } from "express";
import produtoController from "../produtos/produto.controller.js";
import carrinhoController from "../carrinho/carrinho.controller.js";
import Auth from "../middleware/auth.js";
import usuarioController from "../usuarios/usuario.controller.js";

const rotas = Router();

// Todos podem ver produtos
rotas.get("/produtos", Auth, produtoController.listar);
rotas.post("/produtos", Auth, produtoController.adicionar);



// Carrinho (só logado)
rotas.post("/adicionarItem", Auth, carrinhoController.adicionarItem);
rotas.get("/carrinho", Auth, carrinhoController.listar);
rotas.put("/carrinho/:produtoId", Auth, carrinhoController.atualizarQuantidade);
rotas.delete("/carrinho/:produtoId", Auth, carrinhoController.removerItem);
rotas.delete("/carrinho", Auth, carrinhoController.remover);



export default rotas;