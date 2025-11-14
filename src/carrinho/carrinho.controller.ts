import { Request, Response } from "express";
import { ObjectId } from "bson";
import { db } from "../database/banco-mongo.js";

interface ItemCarrinho {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  nome: string;
}

interface Carrinho {
  usuarioId: string;
  itens: ItemCarrinho[];
  dataAtualizacao: Date;
  total: number;
}

interface Produto {
  _id: ObjectId;
  nome: string;
  preco: number;
  descricao: string;
  urlfoto: string;
}

interface RequestAuth extends Request {
  usuarioId?: string;
}

class CarrinhoController {
  async adicionarItem(req: RequestAuth, res: Response) {
    const { produtoId, quantidade } = req.body;
    const usuarioId = req.usuarioId;

    if (!usuarioId) {
      return res.status(401).json({ mensagem: "Token não foi passado para adicionar no carrinho" });
    }

    const produto = await db.collection<Produto>("produtos").findOne({ _id: ObjectId.createFromHexString(produtoId) });
    if (!produto) {
      return res.status(404).json({ mensagem: "Produto não encontrado" });
    }

    const carrinho = await db.collection<Carrinho>("carrinhos").findOne({ usuarioId });

    const novoItem: ItemCarrinho = {
      produtoId,
      quantidade,
      precoUnitario: produto.preco,
      nome: produto.nome,
    };

    if (!carrinho) {
      const novoCarrinho: Carrinho = {
        usuarioId,
        itens: [novoItem],
        dataAtualizacao: new Date(),
        total: produto.preco * quantidade,
      };

      const resposta = await db.collection<Carrinho>("carrinhos").insertOne(novoCarrinho);
      return res.status(201).json({ ...novoCarrinho, _id: resposta.insertedId });
    }

    const itemExistente = carrinho.itens.find((item) => item.produtoId === produtoId);
    if (itemExistente) {
      itemExistente.quantidade += quantidade;
    } else {
      carrinho.itens.push(novoItem);
    }

    carrinho.total = carrinho.itens.reduce((acc, item) => acc + item.precoUnitario * item.quantidade, 0);
    carrinho.dataAtualizacao = new Date();

    await db.collection<Carrinho>("carrinhos").updateOne(
      { usuarioId },
      {
        $set: {
          itens: carrinho.itens,
          total: carrinho.total,
          dataAtualizacao: carrinho.dataAtualizacao,
        },
      }
    );

    res.status(200).json(carrinho);
  }

async removerItem(req: RequestAuth, res: Response) {
  const usuarioId = req.usuarioId;
  const produtoId = req.params.produtoId;

  if (!usuarioId) {
    return res.status(401).json({ mensagem: "Usuário não autenticado" });
  }

  const carrinho = await db.collection<Carrinho>("carrinhos").findOne({ usuarioId });
  if (!carrinho) return res.status(404).json({ mensagem: "Carrinho não encontrado" });

  const itensAtualizados = carrinho.itens.filter((i) => i.produtoId !== produtoId);

  const total = itensAtualizados.reduce(
    (acc, item) => acc + item.precoUnitario * item.quantidade,
    0
  );

  await db.collection("carrinhos").updateOne(
    { usuarioId },
    { $set: { itens: itensAtualizados, total, dataAtualizacao: new Date() } }
  );

  return res.status(200).json({ mensagem: "Item removido com sucesso" });
}


  async atualizarQuantidade(req: RequestAuth, res: Response) {
  const usuarioId = req.usuarioId;   // vem do token
  const produtoId = req.params.produtoId;  // vem da URL
  const { quantidade } = req.body;   // vem do body

  if (!usuarioId) {
    return res.status(401).json({ mensagem: "Usuário não autenticado" });
  }

  if (!quantidade || quantidade < 1) {
    return res.status(400).json({ mensagem: "Quantidade inválida" });
  }

  const carrinho = await db.collection<Carrinho>("carrinhos").findOne({ usuarioId });
  if (!carrinho) {
    return res.status(404).json({ mensagem: "Carrinho não encontrado" });
  }

  const item = carrinho.itens.find((i) => i.produtoId === produtoId);
  if (!item) {
    return res.status(404).json({ mensagem: "Item não encontrado" });
  }

  // Atualiza quantidade no item
  item.quantidade = quantidade;

  // Atualiza total
  carrinho.total = carrinho.itens.reduce(
    (acc, i) => acc + i.precoUnitario * i.quantidade,
    0
  );

  carrinho.dataAtualizacao = new Date();

  await db.collection<Carrinho>("carrinhos").updateOne(
    { usuarioId },
    {
      $set: {
        itens: carrinho.itens,
        total: carrinho.total,
        dataAtualizacao: carrinho.dataAtualizacao,
      },
    }
  );

  return res.status(200).json(carrinho);
}

async listar(req: RequestAuth, res: Response) {
  const usuarioId = req.usuarioId;
  if (!usuarioId) {
    return res.status(401).json({ mensagem: "Usuário não autenticado" });
  }

  const carrinho = await db.collection<Carrinho>("carrinhos").findOne({ usuarioId });
  if (!carrinho) {
    return res.status(200).json({ itens: [] }); // importante: sempre retornar itens: []
  }

  // Montar itens com os produtos populados
  const itensComProduto = [];
  for (const item of carrinho.itens) {
    const produto = await db.collection("produtos").findOne({ _id: new ObjectId(item.produtoId) });
    if (produto) {
      itensComProduto.push({
        _id: item.produtoId, // ID do item
        produto,
        quantidade: item.quantidade
      });
    }
  }

  res.status(200).json({ itens: itensComProduto });
}

  // Método administrativo: listar todos os carrinhos (com itens populados)
  async listarTodos(req: Request, res: Response) {
    const carrinhos = await db.collection<Carrinho>("carrinhos").find().toArray();

    // Para cada carrinho, popular os produtos dos itens
    const resultado = await Promise.all(carrinhos.map(async (c) => {
      const itensPopulados = await Promise.all(c.itens.map(async (item) => {
        const produto = await db.collection("produtos").findOne({ _id: new ObjectId(item.produtoId) });
        return { produto: produto || null, quantidade: item.quantidade, produtoId: item.produtoId };
      }));
      return { usuarioId: c.usuarioId, itens: itensPopulados, total: c.total, dataAtualizacao: c.dataAtualizacao };
    }));

    res.status(200).json(resultado);
  }

  // Método administrativo: excluir o carrinho de um usuário pelo usuarioId
  async excluirPorUsuarioId(req: Request, res: Response) {
    const { usuarioId } = req.params;
    if (!usuarioId) return res.status(400).json({ mensagem: "usuarioId não informado" });

    const carrinho = await db.collection<Carrinho>("carrinhos").findOne({ usuarioId });
    if (!carrinho) return res.status(404).json({ mensagem: "Carrinho não encontrado" });

    await db.collection<Carrinho>("carrinhos").deleteOne({ usuarioId });
    res.status(200).json({ mensagem: "Carrinho do usuário removido com sucesso" });
  }


async remover(req: RequestAuth, res: Response) {
  const usuarioId = req.usuarioId;

  if (!usuarioId) {
    return res.status(401).json({ mensagem: "Usuário não autenticado" });
  }

  await db.collection<Carrinho>("carrinhos").deleteOne({ usuarioId });

  return res.status(200).json({ mensagem: "Carrinho removido com sucesso" });
}
}

export default new CarrinhoController();
