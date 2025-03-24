import express from "express";
import { Cache } from "./Cache";

const app = express();
const args = process.argv.slice(2);

 // Default values
let PORT: number = 3000;
let URL: string = 'https://jsonplaceholder.typicode.com';
const _cache = new Cache();

args.forEach((arg: string, index: number) => {
    if (arg == '--port') {
        PORT = parseInt(args[index + 1]);
    }

    if (arg == '--origin') {
        URL = args[index+1];
    }

    if (arg == '--clear-cache') {
        _cache.clearCache();
    }
})


function respond(res: express.Response, path: string, data: any) {
    res.json({
        message: "im back",
        matchedPath: path,
        apiResponse: data
    });
}

async function handleAPICall(path: string, method: string, body?: any): Promise<any> {
    const options: RequestInit = {
        method,
        headers: body ? { "Content-Type": "application/json; charset=UTF-8" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(`${URL}${path}`, options);

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    return response.json();
}




app.use(express.json());

app.all("*", async (req, res): Promise<void> => {



    let cache: boolean = false;
    const path = req.path;

    if (req.path === "/favicon.ico") {
        res.status(204).end();
        return;
    }

    if (req.method == 'GET') {

        if (await _cache.peekCache(path)) {

            const data = await _cache.getCached(path)

            respond(res, path, data);
            return;
        }
        cache = true;

    }

    const isValidJson = req.headers["content-type"] === "application/json" && (req.body && Object.keys(req.body).length > 0);



    console.log(`request to ${path}`);

    try {
        const data = await handleAPICall(path, req.method, isValidJson ? req.body : undefined);

        if (cache && req.method === 'GET') {
            await _cache.cacheJson(path, data);
        }

        respond(res, path, data);

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error:", error.message);
            res.status(500).json({ error: error.message });
        } else {
            console.error("Unexpected error:", error);
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }

});

app.listen(PORT, () => {
    console.log(`running on port ${PORT}`);
    console.log(`origin: ${URL}`)
});

