import 'dotenv/config'
import express from 'express';
import rotasAutenticadas from './rotas/rotas-autenticadas.js';
import rotasNaoAutenticadas from './rotas/rotas-nao-autenticadas.js';
import Auth from './middleware/auth.js';
import cors from 'cors'
import produtoController from './produtos/produto.controller.js';
import Stripe from "stripe";
const app = express();
app.use(cors())
app.use(express.json());


app.use(rotasNaoAutenticadas);


app.get("/produtos", produtoController.listar);


const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const stripe = new Stripe(stripeSecretKey);



app.post("/pagamento", async (req, res) => {
  try {
    const { amount } = req.body; 

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "brl",
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    res.status(500).json({
      erro: error.message,
    });
  }
});

app.use(Auth);

app.use(rotasAutenticadas);


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

