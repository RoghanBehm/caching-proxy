import express from "express";
import crypto from "crypto";
import * as fs from 'fs/promises';
import * as path from 'path';

const app = express();
const PORT = 3000;

const CACHE_DIR = path.join(__dirname, 'cache');

class Cache {
    private hashRes(url: string): string {
        const key = 'GET ' + url;
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    public async cacheJson(requestUrl: string, jsonData: any): Promise<void> {
        const hash = this.hashRes(requestUrl);
        const filePath = path.join(CACHE_DIR, `${hash}.json`);

        await fs.mkdir(CACHE_DIR, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    }

    public async peekCache(requestUrl: string): Promise<boolean> {
        const hash = this.hashRes(requestUrl);
        const filePath = path.join(CACHE_DIR, `${hash}.json`);

        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    public async getCached(requestUrl: string): Promise<any | null> {
        const hash = this.hashRes(requestUrl);
        const filePath = path.join(CACHE_DIR, `${hash}.json`);

        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
}

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

    const response = await fetch(`https://jsonplaceholder.typicode.com${path}`, options);

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    return response.json();
}



let _cache = new Cache;

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
});

