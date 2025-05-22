-- Create bankroll_ledger table for tracking account balance changes
CREATE TABLE IF NOT EXISTS public.bankroll_ledger (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'bet_cancelled')),
    amount decimal(12,2) NOT NULL, -- positive for credits, negative for debits
    balance_after decimal(12,2) NOT NULL, -- running balance after this transaction
    bet_id uuid REFERENCES public.bets(id) ON DELETE SET NULL, -- link to bet if applicable
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create index for transaction type queries
CREATE INDEX idx_bankroll_ledger_transaction_type ON public.bankroll_ledger(transaction_type);

-- Create index for timestamps (for balance history)
CREATE INDEX idx_bankroll_ledger_created_at ON public.bankroll_ledger(created_at);

-- Create index for bet references
CREATE INDEX idx_bankroll_ledger_bet_id ON public.bankroll_ledger(bet_id) WHERE bet_id IS NOT NULL;

-- Enable RLS on bankroll_ledger
ALTER TABLE public.bankroll_ledger ENABLE ROW LEVEL SECURITY;

-- Bankroll ledger policies
CREATE POLICY "Anyone can read bankroll ledger" ON public.bankroll_ledger
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert bankroll entries" ON public.bankroll_ledger
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update bankroll entries" ON public.bankroll_ledger
    FOR UPDATE USING (auth.role() = 'service_role');

-- Enable Realtime for bankroll ledger
ALTER publication supabase_realtime ADD TABLE public.bankroll_ledger;
