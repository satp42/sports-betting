# NBA Sports Betting Bot

A production-grade NBA betting bot built with modern ML and web technologies. This system follows the architectural patterns from recent academic research on sports betting, model calibration, and feature engineering.

## 🏀 Project Overview

This project implements:
- **Real-time odds ingestion** from The Odds API
- **NBA data integration** with Ball Don't Lie API
- **XGBoost + SHAP** for game outcome prediction
- **GRU neural networks** for shot quality analysis
- **Classwise-ECE calibration** for probability calibration
- **Kelly criterion** for optimal bet sizing
- **Next.js dashboard** with real-time updates via Supabase
- **Ray Serve** for scalable ML model serving

## 🛠️ Development Setup

### Prerequisites

All required tools are now installed:
- ✅ **PNPM** v8.6.9 (Package manager)
- ✅ **Turborepo CLI** v2.5.3 (Monorepo tooling)
- ✅ **Docker** v24.0.5 (Containerization)
- ✅ **Ray** v2.46.0 (ML serving)
- ✅ **Python** 3.13.3 with virtual environment

### Environment Setup

1. **API Keys** (already configured in `.env`):
   ```bash
   THE_ODDS_API_KEY=f2122362bb04e580124db7ab89272f55
   NBA_API_KEY=a9e7dc8b-d8a5-46ed-a061-3dfa27a5e61e
   ```

2. **Supabase** (already configured):
   ```bash
   SUPABASE_URL=https://znkczplpumcnbjgrnupn.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

3. **Python Environment**:
   ```bash
   # Activate virtual environment
   source venv/bin/activate
   
   # Ray is already installed with [serve] extras
   python -c "import ray; print('Ray version:', ray.__version__)"
   ```

## 📁 Project Structure

```
.
├─ apps/
│  ├─ web/                     # Next.js + shadcn/ui dashboard
│  └─ workers/                 # TypeScript workers for data ingestion
├─ packages/
│  ├─ types/                   # Shared TypeScript types
│  ├─ ml-core/                 # Python ML package
│  └─ proto/                   # gRPC definitions
├─ services/
│  ├─ model-server/            # Ray Serve ML deployment
│  ├─ calibrator/              # ECE calibration service
│  └─ edge-functions/          # Supabase Edge Functions
├─ infra/
│  ├─ terraform/               # Infrastructure as code
│  └─ supabase/                # Database migrations
└─ .github/workflows/          # CI/CD pipelines
```

## 🚀 Getting Started

Follow the task roadmap in `docs/tasks.md`. Currently completed:
- ✅ **Task 0.1**: GitHub repository setup
- ✅ **Task 0.2**: API key configuration
- ✅ **Task 0.3**: Supabase project setup
- ✅ **Task 0.4**: Development tools installation

**Next**: Task 1.1 - Initialize Turborepo monorepo structure

## 📊 Data Sources

- **The Odds API**: Real-time NBA betting odds and lines
- **Ball Don't Lie API**: NBA team statistics, player data, and game results
- **Supabase**: Real-time database for odds snapshots and predictions

## 🧠 ML Pipeline

1. **Feature Engineering**: Team stats + odds history + shot quality metrics
2. **Game Outcome Model**: XGBoost with SHAP explanations
3. **Shot Quality Model**: GRU for possession-level analysis
4. **Calibration**: Classwise-ECE for probability reliability
5. **Kelly Sizing**: Fractional Kelly criterion for bankroll management

## 🎯 Architecture Principles

- **Atomic Tasks**: Each development step is ≤30 minutes
- **Testable Components**: Every module has clear test criteria
- **Real-time Updates**: Supabase Realtime for live dashboard
- **Risk Management**: Calibrated probabilities + Kelly criterion
- **Explainable AI**: SHAP values for prediction transparency

## 🔒 Security

- Environment variables protected by `.gitignore`
- Supabase Row Level Security (RLS) configured
- Service role JWT for privileged operations
- API rate limiting and error handling

---

Built with ❤️ for responsible sports analytics and risk management. 