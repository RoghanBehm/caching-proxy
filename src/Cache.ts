import crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

const CACHE_DIR = path.join(__dirname, "cache");

export class Cache {
    public async clearCache(): Promise<void> {
        try {
            const files = await fs.readdir(CACHE_DIR);
            await Promise.all(files.map(file => fs.unlink(path.join(CACHE_DIR, file))));
            console.log("Cache cleared.");
        } catch (err) {
            console.error("Failed to clear cache:", err);
        }
    }

    private hashRes(url: string): string {
        const key = 'GET ' + url;
        return crypto.createHash("sha256").update(key).digest("hex");
    }

    public async cacheJson(requestUrl: string, jsonData: any): Promise<void> {
        const hash = this.hashRes(requestUrl);
        const filePath = path.join(CACHE_DIR, `${hash}.json`);
        await fs.mkdir(CACHE_DIR, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
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
            const data = await fs.readFile(filePath, "utf-8");
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
}
