-- Create odds_snapshots table for betting odds data
CREATE TABLE IF NOT EXISTS public.odds_snapshots (
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    market text NOT NULL, -- e.g., 'h2h', 'spreads', 'totals'
    ts timestamp with time zone NOT NULL DEFAULT now(),
    bookmaker text NOT NULL,
    home_odds decimal(10,4),
    away_odds decimal(10,4),
    home_point decimal(5,2), -- for spreads/totals
    away_point decimal(5,2), -- for spreads/totals
    over_under decimal(5,2), -- for totals
    raw_data jsonb, -- store complete API response
    
    -- Composite primary key
    PRIMARY KEY (game_id, market, ts, bookmaker)
);

-- Create index for timestamp queries
CREATE INDEX idx_odds_snapshots_ts ON public.odds_snapshots(ts);

-- Create index for game lookups
CREATE INDEX idx_odds_snapshots_game_id ON public.odds_snapshots(game_id);

-- Create index for market type queries
CREATE INDEX idx_odds_snapshots_market ON public.odds_snapshots(market);
