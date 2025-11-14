//Explicando o que é um middleware
import jwt from 'jsonwebtoken'
import {Request, Response, NextFunction} from 'express'

interface RequestAuth extends Request{
    usuarioId?:string
    tipo?: string
}

function Auth(req:RequestAuth,res:Response,next:NextFunction){
    const authHeader = req.headers.authorization
    if(!authHeader)
        return res.status(401).json({
            mensagem: "Acesso não autorizado",
            detalhes: "Você precisa fazer login para acessar este recurso"
        })
    const token = authHeader.split(" ")[1]!
    jwt.verify(token,process.env.JWT_SECRET!,(err,decoded)=>{
        if(err){
            console.log(err)
            return res.status(401).json({
                mensagem: "Sessão expirada",
                detalhes: "Por favor, faça login novamente para continuar"
            })
        }
        if(typeof decoded==="string"||!decoded||!("usuarioId" in decoded))
            return res.status(401).json({
                mensagem: "Erro de autenticação",
                detalhes: "Houve um problema com suas credenciais. Por favor, faça login novamente"
            })

    const payload = decoded as any;
    req.usuarioId = payload.usuarioId;
    req.tipo = String(payload.tipo || 'user').toLowerCase();
    next()

    })
}

export default Auth