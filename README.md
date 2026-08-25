# ETF 股息雲端版資料庫

使用 Supabase PostgreSQL。

核心資料表：
- portfolios：使用者投資組合與目標
- etfs：ETF 基本資料
- holdings：張數、平均成本、目前價格
- dividends：每次實際/手動配息
- dividend_schedules：預計配息月份
- price_history：歷史股價
- dividend_goals：月/年股息目標

手動配息可直接修改 `dividends.dividend_per_unit`，並以 `is_manual=true` 保留使用者設定。未來接 TWSE/TPEx API 時可保留官方資料與手動覆寫。

部署：
1. 建立 Supabase Project
2. SQL Editor 執行 `supabase/schema.sql`
3. 可選執行 `supabase/seed.sql`
4. 前端設定 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
5. 部署至 Vercel
