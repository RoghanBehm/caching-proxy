import express from "express";
import crypto from "crypto";
import * as fs from 'fs/promises';
import * as path from 'path';

const app = express();
const PORT = 3000;

const CACHE_DIR = path.join(__dirname, 'cache');


function hashRes(url: string) {
    const key = 'GET ' + url;
    return crypto.createHash('sha256').update(key).digest('hex');
}

async function cacheJson(requestUrl: string, jsonData: any): Promise<void> {
    const hash = hashRes(requestUrl);
    const filePath = path.join(CACHE_DIR, `${hash}.json`);
  
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
}

async function peekCache(requestUrl: string): Promise<boolean> {
    const hash = hashRes(requestUrl);
    const filePath = path.join(CACHE_DIR, `${hash}.json`);

    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function getCached(requestUrl: string): Promise<any | null> {
    const hash = hashRes(requestUrl);
    const filePath = path.join(CACHE_DIR, `${hash}.json`);
  
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  

app.use(express.json());

app.all("*", async (req, res): Promise<void> => {


 
    let cache: Boolean = false;
    const path = req.path;


    if (req.method == 'GET') {
        
        if (await peekCache(path)) {

            const data = await getCached(path)

            res.json({
                message: "im back",
                matchedPath: path,
                apiResponse: data
            });
        }
        cache = true;

    }

    const isValidJson = req.headers["content-type"] === "application/json" && (req.body && Object.keys(req.body).length > 0);

    if (req.path === "/favicon.ico") {
        res.status(204).end();
        return;
    }


    console.log(`request to ${path}`);

    try {
        if (isValidJson) {
            let fetchOptions: RequestInit = { method: req.method };
            fetchOptions = {
                ...fetchOptions,
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify(req.body),
            };
            const response = await fetch(`https://jsonplaceholder.typicode.com${path}`, fetchOptions);

            const data = await response.json();

            if (cache && req.method == 'GET') {
                cacheJson(path, data);
            }

            res.json({
                message: "im back",
                matchedPath: path,
                apiResponse: data
            });
            return;
        }

        const response = await fetch(`https://jsonplaceholder.typicode.com${path}`);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        if (cache && req.method == 'GET') {
            cacheJson(path, data);
        }

        res.json({
            message: "im back",
            matchedPath: path,
            apiResponse: data
        });

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

