export default async function handler(req, res) {
  const raw = String(req.query.symbol || "").trim().replace(/[^0-9A-Za-z.-]/g, "").toUpperCase();
  if (!raw) return res.status(400).json({ error: "請提供 ETF 代號" });

  const symbolsToTry = raw.includes('.') ? [raw] : [`${raw}.TW`, `${raw}.TWO`];

  for (const symbol of symbolsToTry) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&events=div`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "*/*"
        }
      });

      if (!response.ok) continue;
      const payload = await response.json();
      const result = payload.chart?.result?.[0];
      if (!result?.meta) continue;

      const currentYear = new Date().getFullYear();
      const dividends = Object.values(result.events?.dividends || {})
        .map((item) => ({
          date: new Date(item.date * 1000).toISOString().slice(0, 10),
          amount: Number(item.amount)
        }))
        .filter((item) => item.date.startsWith(String(currentYear)));

      return res.status(200).json({
        symbol: raw.replace(/\.TW(O)?$/i, ""),
        name: result.meta.longName || result.meta.shortName || raw,
        price: Number(result.meta.regularMarketPrice || result.meta.previousClose || 0),
        updatedAt: result.meta.regularMarketTime ? new Date(result.meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
        dividends
      });
    } catch (e) {
      // 嘗試下一個代號格式
    }
  }

  return res.status(502).json({ error: "暫時無法取得公開行情，請手動輸入。" });
}