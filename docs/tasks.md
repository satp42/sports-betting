In the roadmap below you’ll find **70 atomic tasks** arranged in eight build phases.  Every task is purposely bite-sized (≤ 30 min for one engineer), has a clear “Done” condition, and touches exactly one surface of the stack described earlier.  Inline citations point you straight to the relevant reference docs so your engineering LLM can open them when it needs more detail.

---

## Phase 0 – Project prerequisites

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Definition of Done                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 0.1 | Create a new private GitHub repo and enable required branch protection rules.                                                                                                                                                                                                                                                                                                                                                                                 | `main`protected and empty repo exists.                       |
| 0.2 | Generate Dexsport API key / on-chain wallet that will sign bets. ([https://dexsport.io](https://dexsport.io/docs-home/?utm_source=chatgpt.com "Welcome to Dexsport documentation."))                                                                                                                                                                                                                                                                                | `.env`file contains `DEXSPORT_KEY`and testnet private key. |
| 0.3 | Spin up a free Supabase project and record `SUPABASE_URL`/`ANON_KEY`. ([Supabase](https://supabase.com/docs/guides/functions?utm_source=chatgpt.com "Edge Functions                                                                                                                                                                                                                                                                                       | Supabase Docs"))                                               |
| 0.4 | Install PNPM, Turborepo CLI, Docker Desktop, and the Ray nightly wheel locally. ([Vercel](https://vercel.com/templates/next.js/monorepo-turborepo?utm_source=chatgpt.com "Monorepo with Turborepo - Vercel"),[Docker Documentation](https://docs.docker.com/compose/gettingstarted/?utm_source=chatgpt.com "Docker Compose Quickstart"),[Ray](https://docs.ray.io/en/latest/serve/index.html?utm_source=chatgpt.com "Ray Serve: Scalable and Programmable Serving - Ray Docs")) |                                                                |

---

## Phase 1 – Monorepo & tooling

| #   | Task                                                                                                                                                                                                                                                                                                                                  | Done when                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1.1 | `pnpm create turbo@latest`→ choose*“web + node worker”*preset. ([Vercel](https://vercel.com/templates/next.js/monorepo-turborepo?utm_source=chatgpt.com "Monorepo with Turborepo - Vercel"))                                                                                                                                           | `apps/web`and `apps/workers`folders appear.          |
| 1.2 | Configure**Prettier**+**ESLint**root configs; push a failing lint to verify CI gates.                                                                                                                                                                                                                                     |                                                          |
| 1.3 | Add a root `docker-compose.yml`that boots Postgres, Kafka, and Ray head. ([Docker Documentation](https://docs.docker.com/compose/gettingstarted/?utm_source=chatgpt.com "Docker Compose Quickstart"))                                                                                                                                     | `docker compose up`shows all three containers healthy. |
| 1.4 | Create `.github/workflows/ci.yml`that runs `turbo run lint test build`. ([GitHub Docs](https://docs.github.com/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/customizing-your-advanced-setup-for-code-scanning?utm_source=chatgpt.com "Customizing your advanced setup for code scanning - GitHub Docs")) | PR check turns green after passing run.                  |

---

## Phase 2 – Database layer (Supabase SQL migrations)

> Each task is one SQL file inside `infra/supabase/migrations`.

| #   | Task                                                                                                                                                                             | Done when        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 2.1 | Create `games`table (`id`,`home`,`away`,`tipoff`).                                                                                                                     |                  |
| 2.2 | Create `odds_snapshots`table with composite PK `(game_id, market, ts)`.                                                                                                      |                  |
| 2.3 | Create `features`table storing JSONB vector per team, keyed by `(game_id, team_id)`.                                                                                         |                  |
| 2.4 | Create `predictions`table with columns `edge`,`p_home`,`shap`,`ts`.                                                                                                    |                  |
| 2.5 | Create `bets`table with `tx_hash`,`stake`,`status`.                                                                                                                      |                  |
| 2.6 | Enable Supabase**Realtime**on `odds_snapshots`&`predictions`. ([Supabase](https://supabase.com/docs/guides/realtime/protocol?utm_source=chatgpt.com "Realtime Protocol | Supabase Docs")) |
| 2.7 | Write RLS: anonymous users `select`only; service-role JWT can `insert/update`.                                                                                               |                  |
| 2.8 | Apply migrations locally through `supabase db reset`and in cloud dashboard.                                                                                                    |                  |

---

## Phase 3 – Data ingestion worker (`apps/workers/ingest`)

| #   | Task                                                                                                                                                                                                            | Done when               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 3.1 | Bootstrap a TypeScript project with ts-node inside `ingest`.                                                                                                                                                  |                         |
| 3.2 | Implement REST fetch of Dexsport upcoming NBA lines (`/odds/upcoming`). ([https://dexsport.io](https://dexsport.io/docs-home/?utm_source=chatgpt.com "Welcome to Dexsport documentation."))                         | Logs show JSON payload. |
| 3.3 | Normalise response into `{game_id, market, decimal_odds}`records.                                                                                                                                             |                         |
| 3.4 | Insert snapshot batch into Supabase using service JWT. ([Supabase](https://supabase.com/docs/guides/functions?utm_source=chatgpt.com "Edge Functions                                                            | Supabase Docs"))        |
| 3.5 | Publish the same payload to local Kafka topic `odds.updates`. ([Confluent](https://developer.confluent.io/get-started/javascript/?utm_source=chatgpt.com "Apache Kafka and JavaScript - Getting Started Tutorial")) |                         |
| 3.6 | Add jest test mocking HTTP → expect exactly one Supabase insert per call.                                                                                                                                      |                         |
| 3.7 | Schedule cron (`node-cron`) for 60-second polling; run containerised via compose.                                                                                                                             |                         |

---

## Phase 4 – Feature engineering & model training (`packages/ml-core`)

| #   | Task                                                                                                                                                                                                                                         | Done when |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 4.1 | Write Python module `features.py`that joins `games`+ last 10 `odds_snapshots`+ SportsData team stats. ([SportsDataIO](https://sportsdata.io/developers/api-documentation/nba?utm_source=chatgpt.com "NBA API Documentation - SportsDataIO")) |           |
| 4.2 | Unit-test feature builder with a static fixture set.                                                                                                                                                                                         |           |
| 4.3 | Train baseline**XGBoost**classifier on historic seasons. ([XGBoost Documentation](https://xgboost.readthedocs.io/?utm_source=chatgpt.com "XGBoost Documentation — xgboost 3.0.1 documentation"))                                            |           |
| 4.4 | Save model as `xgboost.json`artifact and checksum.                                                                                                                                                                                         |           |
| 4.5 | Compute SHAP values via `TreeExplainer`and persist to parquet. ([SHAP](https://shap.readthedocs.io/en/latest/generated/shap.TreeExplainer.html?utm_source=chatgpt.com "shap.TreeExplainer — SHAP latest documentation"))                        |           |
| 4.6 | Implement classwise-ECE calibration routine (“20-bin histogram”).                                                                                                                                                                          |           |
| 4.7 | Plot calibration curve test → expect < 2 % ECE on validation set.                                                                                                                                                                           |           |
| 4.8 | Create `shot_quality.py`GRU model skeleton; stub with random weights for now.                                                                                                                                                              |           |
| 4.9 | PyTest for GRU forward-pass shape `[batch, seq_len, 1]`.                                                                                                                                                                                   |           |

---

## Phase 5 – Serving layer (Ray Serve + calibration micro-service)

| #   | Task                                                                                                                                                                                                    | Done when |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 5.1 | Define Ray Serve deployment `GamePredictor`loading XGBoost + SHAP. ([Ray](https://docs.ray.io/en/latest/serve/index.html?utm_source=chatgpt.com "Ray Serve: Scalable and Programmable Serving - Ray Docs")) |           |
| 5.2 | Expose `/predict`accepting feature JSON; returns `p_home`,`shap`,`timestamp`.                                                                                                                   |           |
| 5.3 | Add `Calibrator`deployment that wraps predictor output and applies ECE bins.                                                                                                                          |           |
| 5.4 | Smoke test with cURL → JSON contains calibrated probs.                                                                                                                                                 |           |
| 5.5 | Write locust file stress-testing 50 RPS locally; latency < 100 ms p95.                                                                                                                                  |           |

---

## Phase 6 – Betting engine (Supabase Edge Function `executeBet.ts`)

| #   | Task                                                                                                                                                                                                                                                                                  | Done when        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 6.1 | Scaffold Edge Function via `supabase functions new executeBet`. ([Supabase](https://supabase.com/docs/guides/functions?utm_source=chatgpt.com "Edge Functions                                                                                                                       | Supabase Docs")) |
| 6.2 | Inside handler, fetch current bankroll from `bankroll_ledger`.                                                                                                                                                                                                                      |                  |
| 6.3 | Implement fractional**Kelly**stake calc:`f = p - (1-p)/b`then `stake = k*f*bankroll`with `k = 0.25`. ([Investopedia](https://www.investopedia.com/articles/trading/04/091504.asp?utm_source=chatgpt.com "Using the Kelly Criterion for Asset Allocation and Money Management")) |                  |
| 6.4 | Call Dexsport smart-contract `placeBet`with Ethers.js; return tx hash on success. ([https://dexsport.io](https://dexsport.io/docs-home/?utm_source=chatgpt.com "Welcome to Dexsport documentation."))                                                                                     |                  |
| 6.5 | Insert new row into `bets`with returned hash and status `pending`.                                                                                                                                                                                                                |                  |
| 6.6 | Write unit test stubbing Ethers provider to ensure errors bubble correctly.                                                                                                                                                                                                           |                  |

---

## Phase 7 – Dashboard (`apps/web`)

| #   | Task                                                                                                                                                                                          | Done when        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 7.1 | Upgrade to**Next.js 14 App Router** ; create route `/bets`as Server Component. ([Next.js](https://nextjs.org/docs/app?utm_source=chatgpt.com "Introduction: App Router - Next.js"))         |                  |
| 7.2 | Run `pnpm dlx shadcn-ui@latest init`to install UI toolkit. ([Shadcn UI](https://ui.shadcn.com/docs/installation/next?utm_source=chatgpt.com "Next.js - Shadcn UI"))                               |                  |
| 7.3 | Add Tailwind config & global.css.                                                                                                                                                             |                  |
| 7.4 | Build `EdgeCard`component that listens to `predictions`via Supabase client hook. ([Supabase](https://supabase.com/docs/guides/realtime/protocol?utm_source=chatgpt.com "Realtime Protocol | Supabase Docs")) |
| 7.5 | Render SHAP beeswarm with Recharts `ScatterChart`. ([Recharts](https://recharts.org/?utm_source=chatgpt.com "Recharts"))                                                                          |                  |
| 7.6 | Add `BankrollChart`line graph streaming from `bankroll_ledger`channel.                                                                                                                    |                  |
| 7.7 | Add Cypress e2e: when API stubs emit a positive edge it shows**“VALUE BET”**badge.                                                                                                          |                  |
| 7.8 | Web Vitals budget - LCP < 2.5 s on local Lighthouse run.                                                                                                                                      |                  |

---

## Phase 8 – Operational hardening & release

| #   | Task                                                                                     | Done when |
| --- | ---------------------------------------------------------------------------------------- | --------- |
| 8.1 | Add Ray metrics scrape to Prometheus and Grafana dashboard panel.                        |           |
| 8.2 | Write GitHub Action that builds Docker images, pushes to GHCR, deploys to Fly.io.        |           |
| 8.3 | Set Supabase Edge Function URL as secret in Fly deploy step.                             |           |
| 8.4 | Create scheduled job to retrain XGBoost weekly and commit new model hash.                |           |
| 8.5 | Enable error-alert webhook (e.g., Discord) for Ray Serve exceptions.                     |           |
| 8.6 | Write post-mortem template Markdown in `/docs/incidents`.                              |           |
| 8.7 | Tag repo `v0.1.0`and create release notes summarising calibration ECE score.           |           |
| 8.8 | Celebrate: place first $1 testnet wager and verify dashboard reflects settled result. 🎉 |           |

---

### How to execute

Work sequentially down the table (or feed tasks to an orchestrating LLM).  Because every task is both **independent** and  **assertable** , you can safely parallelise across contributors or CI jobs—merging only when the “Done” line is green on its micro-test.  By the time you reach Phase 8, you’ll have a functioning, risk-managed NBA betting MVP that mirrors the math from the cited papers and surfaces transparent explanations in a polished shadcn-powered UI.
