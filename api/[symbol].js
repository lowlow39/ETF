// api/etf/[symbol].js
export default async function handler(req, res) {
  const { symbol } = req.query;
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    // 使用 Yahoo Finance 的公開 API 取得即時資料
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}.TW?interval=1d&range=1d`
    );
    const data = await response.json();
    const result = data.chart.result?.[0];

    if (!result) {
      return res.status(404).json({ error: "找不到該股票資料" });
    }

    const currentPrice = result.meta.regularMarketPrice || 0;

    // 常用中文名稱對照
    const nameMap = {
      "0056": "元大高股息",
      "00878": "國泰永續高股息",
      "00929": "復華台灣科技優息",
      "00919": "群益台灣精選高息",
      "00940": "元大台灣價值高息",
      "0050": "元大台灣50",
      "006208": "富邦台50"
    };

    return res.status(200).json({
      symbol: cleanSymbol,
      name: nameMap[cleanSymbol] || `ETF ${cleanSymbol}`,
      price: Math.round(currentPrice * 100) / 100,
      lastDividend: 0.5, // 注意：公開 API 的配息需抓取歷史紀錄，可整合 Supabase 資料庫
      payMonths: [1, 4, 7, 10],
      frequency: 4
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
