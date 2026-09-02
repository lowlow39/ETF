export default async function handler(req, res) {
  const raw = String(req.query.symbol || "").trim().replace(/[^0-9A-Za-z.-]/g, "");
  if (!raw) return res.status(400).json({ error: "請提供 ETF 代號" });

  const symbol = /\.TW$|\.TWO$/i.test(raw) ? raw.toUpperCase() : `${raw}.TW`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&events=div`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ETF cashflow dashboard (personal use)" }
    });
    if (!response.ok) throw new Error(`行情服務回應 ${response.status}`);
    const payload = await response.json();
    const result = payload.chart?.result?.[0];
    if (!result?.meta) throw new Error("找不到這個代號的資料");

    const dividends = Object.values(result.events?.dividends || {})
      .map((item) => ({
        date: new Date(item.date * 1000).toISOString().slice(0, 10),
        amount: Number(item.amount)
      }))
      .filter((item) => item.date.startsWith(String(new Date().getFullYear())));

    return res.status(200).json({
      symbol: raw.replace(/\.TW(O)?$/i, ""),
      name: result.meta.longName || result.meta.shortName || raw,
      price: Number(result.meta.regularMarketPrice || result.meta.previousClose || 0),
      updatedAt: result.meta.regularMarketTime ? new Date(result.meta.regularMarketTime * 1000).toISOString() : null,
      dividends
    });
  } catch (error) {
    return res.status(502).json({ error: "暫時無法取得公開行情，請稍後重試或手動輸入。" });
  }
}
