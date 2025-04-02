const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const CACHE_FILE = path.join(__dirname, "projects_cache.json");
const PROJECT_CACHE_DIR = path.join(__dirname, "projects_details_cache");
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

app.use(cors());

// Garante que a pasta de cache de projetos existe
if (!fs.existsSync(PROJECT_CACHE_DIR)) {
  fs.mkdirSync(PROJECT_CACHE_DIR);
}

// Função para verificar se o cache de um projeto específico é válido
const isProjectCacheValid = (projectId) => {
  const projectCacheFile = path.join(PROJECT_CACHE_DIR, `${projectId}.json`);
  if (!fs.existsSync(projectCacheFile)) return false;

  const stats = fs.statSync(projectCacheFile);
  const lastModified = stats.mtime.getTime();
  const now = Date.now();

  return now - lastModified < CACHE_DURATION;
};

// Função para buscar os detalhes de um projeto e armazenar no cache
const fetchProjectDetailsAndCache = async (projectId) => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    await page.goto(`https://www.artstation.com/projects/${projectId}.json`, {
      waitUntil: "networkidle2",
    });

    const content = await page.evaluate(() => document.body.innerText);
    await browser.close();

    const data = JSON.parse(content);
    
    // Salva os detalhes do projeto no cache
    const projectCacheFile = path.join(PROJECT_CACHE_DIR, `${projectId}.json`);
    fs.writeFileSync(projectCacheFile, JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error("Erro ao buscar detalhes do projeto:", error);
    return null;
  }
};

// Rota para pegar a lista de projetos com cache
app.get("/api/projects", async (req, res) => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const stats = fs.statSync(CACHE_FILE);
      if (Date.now() - stats.mtime.getTime() < CACHE_DURATION) {
        console.log("Usando cache de projetos...");
        return res.json(JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")));
      }
    }

    console.log("Buscando novos projetos...");
    const newData = await fetchDataAndCache();
    if (newData) return res.json(newData);

    res.status(500).json({ error: "Erro ao buscar dados da API" });
  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ error: "Erro ao processar requisição" });
  }
});

// Rota para pegar os detalhes de um projeto com cache
app.get("/api/projects/:id", async (req, res) => {
  const projectId = req.params.id;
  const projectCacheFile = path.join(PROJECT_CACHE_DIR, `${projectId}.json`);

  try {
    if (isProjectCacheValid(projectId)) {
      console.log(`Usando cache para projeto ${projectId}...`);
      return res.json(JSON.parse(fs.readFileSync(projectCacheFile, "utf8")));
    }

    console.log(`Buscando novos detalhes para projeto ${projectId}...`);
    const newData = await fetchProjectDetailsAndCache(projectId);
    if (newData) return res.json(newData);

    res.status(500).json({ error: "Erro ao buscar detalhes do projeto" });
  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ error: "Erro ao processar requisição" });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Proxy rodando em http://localhost:${PORT}`);
});
