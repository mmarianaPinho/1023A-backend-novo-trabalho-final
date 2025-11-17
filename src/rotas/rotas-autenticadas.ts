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

// --- Rotas administrativas (apenas ADMIN) ---
function onlyAdmin(req: any, res: any, next: any) {
  if (req.tipo !== "admin") return res.status(403).json({ mensagem: "Acesso restrito a administradores." });
  next();
}

// Listar todos os carrinhos (ADMIN)
rotas.get("/admin/carrinhos", Auth, onlyAdmin, carrinhoController.listarTodos);

// Excluir carrinho de qualquer usuário (ADMIN)
rotas.delete("/admin/carrinho/:usuarioId", Auth, onlyAdmin, carrinhoController.excluirPorUsuarioId);

// Listar todos os usuários (ADMIN)
rotas.get("/admin/usuarios", Auth, onlyAdmin, usuarioController.listar);

// Excluir usuário (ADMIN)
rotas.delete("/admin/usuarios/:usuarioId", Auth, onlyAdmin, usuarioController.remover);

export default rotas;