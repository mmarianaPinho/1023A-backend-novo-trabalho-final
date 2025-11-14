import { Request, Response } from "express";
import { db } from "../database/banco-mongo.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class UsuarioController {
    // ✅ Cadastrar usuário com tipo (padrão: CLIENTE)
    async adicionar(req: Request, res: Response) {
        const { nome, idade, email, senha, tipo = "user" } = req.body;

        if (!nome || !email || !senha || !idade) {
            return res.status(400).json({
                mensagem: "Dados incompletos (nome, email, senha, idade)",
            });
        }

        // Criptografa a senha
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const usuario = {
            nome,
            idade,
            email,
            senha: senhaCriptografada,
            tipo: String(tipo || 'user').toLowerCase(), // armazenar em lowercase
        };

        const resultado = await db.collection("usuarios").insertOne(usuario);

        res.status(201).json({ ...usuario, _id: resultado.insertedId });
    }

    // ✅ Listar todos os usuários
    async listar(req: Request, res: Response) {
        const usuarios = await db.collection("usuarios").find().toArray();
        res.status(200).json(usuarios);
    }

    // ✅ Remover usuário por ID (ADMIN)
    async remover(req: Request, res: Response) {
        const { usuarioId } = req.params;
        if (!usuarioId) return res.status(400).json({ mensagem: "usuarioId não informado" });

        const resultado = await db.collection("usuarios").deleteOne({ _id: new ObjectId(usuarioId) });
        if (resultado.deletedCount === 0) return res.status(404).json({ mensagem: "Usuário não encontrado" });

        res.status(200).json({ mensagem: "Usuário removido com sucesso" });
    }

    // ✅ Login com token que contém nome e tipo
    async login(req: Request, res: Response) {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res
                .status(400)
                .json({ mensagem: "Email e senha são obrigatórios!" });
        }

        const usuario = await db.collection("usuarios").findOne({ email });

        if (!usuario) {
            return res.status(400).json({ mensagem: "Usuário incorreto!" });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(400).json({ mensagem: "Senha inválida!" });
        }

        // ✅ Token agora inclui nome e tipo
        const token = jwt.sign(
            {
                usuarioId: usuario._id,
                nome: usuario.nome,
                tipo: String(usuario.tipo || 'user').toLowerCase(),
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        res.status(200).json({ token, tipo: String(usuario.tipo || 'user').toLowerCase() });
    }
}

export default new UsuarioController();