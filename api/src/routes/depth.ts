import { Router } from "express";


export const depthRouter = Router();

depthRouter.get("/", async(req, res) => {
    const { symbol } = req.query;
    
})