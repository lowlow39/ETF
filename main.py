from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/etf/{symbol}")
def get_etf_info(symbol: str):
    symbol_clean = symbol.strip().upper()
    ticker_symbol = f"{symbol_clean}.TW"
    
    try:
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.fast_info
        dividends = ticker.dividends

        current_price = info.get('lastPrice', 0.0)
        
        # 若台股上市抓不到，試試上櫃 (.TWO)
        if (dividends is None or len(dividends) == 0) and current_price == 0:
            ticker_two = yf.Ticker(f"{symbol_clean}.TWO")
            dividends = ticker_two.dividends
            info = ticker_two.fast_info
            current_price = info.get('lastPrice', 0.0)

        last_dividend = 0.0
        pay_months = [1, 4, 7, 10]
        
        if dividends is not None and len(dividends) > 0:
            recent_dividends = dividends.tail(12)
            last_dividend = float(recent_dividends.iloc[-1])
            pay_months = list(set([d.month for d in recent_dividends.index]))

        # 股票中文名稱對照表（Yahoo Finance 台股名稱多為英文，可手動對映）
        name_map = {
            "0056": "元大高股息",
            "00878": "國泰永續高股息",
            "00929": "復華台灣科技優息",
            "00919": "群益台灣精選高息",
            "00940": "元大台灣價值高息",
            "0050": "元大台灣50",
            "006208": "富邦台50"
        }
        
        stock_name = name_map.get(symbol_clean, f"ETF {symbol_clean}")

        return {
            "symbol": symbol_clean,
            "name": stock_name,
            "price": round(current_price, 2),
            "lastDividend": round(last_dividend, 2),
            "payMonths": sorted(pay_months),
            "frequency": len(pay_months) if len(pay_months) > 0 else 4
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"抓取失敗: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)