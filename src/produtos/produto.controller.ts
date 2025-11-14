import { Request, Response } from 'express';
import { db } from '../database/banco-mongo.js';
class ProdutoController {
    async adicionar(req:Request, res:Response) {
        const {nome,preco,descricao,urlfoto} = req.body;
        const produto = {nome,preco,descricao,urlfoto};
        const resposta = await db.collection('produtos').insertOne(produto);
        res.status(201).json({...produto, _id: resposta.insertedId});
    }
    async listar(req:Request, res:Response) {
        const produtos = await db.collection('produtos').find().toArray();
        res.status(200).json(produtos);
    }
}
export default new ProdutoController();