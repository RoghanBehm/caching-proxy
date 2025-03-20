import express from "express";

const app = express();
const PORT = 3000;

class Server {

    private app = express();

    constructor() {
        this.setupRoutes();
    }

    private setupRoutes() {
        this.app.get("/", (req, res) => {
            res.send("ok im back");
        }
        )
    };

    public start(port: number) {
        this.app.listen(PORT, () => {
            console.log(`running \n port ${PORT} `)
        })
    }

    
}

const server = new Server;