-- Create bets table for tracking betting transactions
CREATE TABLE IF NOT EXISTS public.bets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    prediction_id uuid REFERENCES public.predictions(id) ON DELETE SET NULL,
    tx_hash text UNIQUE, -- blockchain/payment transaction hash
    stake decimal(12,2) NOT NULL CHECK (stake > 0), -- bet amount in currency units
    odds decimal(10,4) NOT NULL CHECK (odds > 0), -- odds at time of bet
    market text NOT NULL, -- betting market (h2h, spread, total, etc.)
    selection text NOT NULL, -- what was bet on (home, away, over, under, etc.)
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'placed', 'won', 'lost', 'cancelled', 'void')),
    potential_payout decimal(12,2), -- calculated potential payout
    actual_payout decimal(12,2), -- actual payout (if settled)
    bookmaker text,
    placed_at timestamp with time zone DEFAULT now(),
    settled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create index for game lookups
CREATE INDEX idx_bets_game_id ON public.bets(game_id);

-- Create index for transaction hash lookups
CREATE INDEX idx_bets_tx_hash ON public.bets(tx_hash) WHERE tx_hash IS NOT NULL;

-- Create index for status queries
CREATE INDEX idx_bets_status ON public.bets(status);

-- Create index for timestamp queries
CREATE INDEX idx_bets_placed_at ON public.bets(placed_at);

-- Create index for prediction lookups
CREATE INDEX idx_bets_prediction_id ON public.bets(prediction_id) WHERE prediction_id IS NOT NULL;
