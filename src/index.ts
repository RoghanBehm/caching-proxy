import express from "express";

const app = express();
const PORT = 3000;

app.get("*", async (req, res): Promise<void> => {
    
  const path = req.path;

    if (req.path === "/favicon.ico") {
        res.status(204).end();
        return;
    }

  console.log(`request to ${path}`);

  try {
      const response = await fetch(`https://jsonplaceholder.typicode.com${path}`);

      if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

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
    
