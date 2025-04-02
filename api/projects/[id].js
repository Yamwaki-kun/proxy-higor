import puppeteer from "puppeteer";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "ID do projeto é obrigatório" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    await page.goto(`https://www.artstation.com/projects/${id}.json`, {
      waitUntil: "networkidle2",
    });

    const content = await page.evaluate(() => document.body.innerText);
    await browser.close();

    const data = JSON.parse(content);
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Erro ao buscar detalhes do projeto ${id}:`, error);
    return res.status(500).json({ error: "Erro ao processar requisição" });
  }
}