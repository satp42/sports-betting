-- Create predictions table for ML model outputs
CREATE TABLE IF NOT EXISTS public.predictions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    edge decimal(10,6) NOT NULL, -- betting edge (positive = value bet)
    p_home decimal(10,6) NOT NULL CHECK (p_home >= 0 AND p_home <= 1), -- probability home team wins
    shap jsonb NOT NULL, -- SHAP feature importance values
    model_version text DEFAULT 'v1.0',
    calibration_applied boolean DEFAULT false,
    ts timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    
    -- Ensure probabilities are valid
    CONSTRAINT valid_probabilities CHECK (p_home >= 0 AND p_home <= 1)
);

-- Create index for game lookups
CREATE INDEX idx_predictions_game_id ON public.predictions(game_id);

-- Create index for timestamp queries
CREATE INDEX idx_predictions_ts ON public.predictions(ts);

-- Create index for edge queries (finding value bets)
CREATE INDEX idx_predictions_edge ON public.predictions(edge);

-- Create GIN index for SHAP JSONB queries
CREATE INDEX idx_predictions_shap_gin ON public.predictions USING gin(shap);

-- Create index for model version tracking
CREATE INDEX idx_predictions_model_version ON public.predictions(model_version);
