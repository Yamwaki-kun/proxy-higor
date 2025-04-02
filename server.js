const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());

// Função para buscar a lista de projetos
const fetchProjects = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    await page.goto("https://www.artstation.com/users/higoramarall/projects.json", {
      waitUntil: "networkidle2",
    });

    const content = await page.evaluate(() => document.body.innerText);
    await browser.close();

    return JSON.parse(content);
  } catch (error) {
    console.error("Erro ao buscar lista de projetos:", error);
    return null;
  }
};

// Função para buscar os detalhes de um projeto
const fetchProjectDetails = async (projectId) => {
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

    return JSON.parse(content);
  } catch (error) {
    console.error("Erro ao buscar detalhes do projeto:", error);
    return null;
  }
};

// Rota para pegar a lista de projetos
app.get("/api/projects", async (req, res) => {
  try {
    console.log("Buscando novos projetos...");
    const newData = await fetchProjects();
    if (newData) return res.json(newData);

    res.status(500).json({ error: "Erro ao buscar dados da API" });
  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ error: "Erro ao processar requisição" });
  }
});

// Rota para pegar os detalhes de um projeto
app.get("/api/projects/:id", async (req, res) => {
  const projectId = req.params.id;
  try {
    console.log(`Buscando detalhes para projeto ${projectId}...`);
    const newData = await fetchProjectDetails(projectId);
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
