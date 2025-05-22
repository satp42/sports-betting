import { OddsApiResponse } from '../api/odds-api';

export interface NormalizedOddsRecord {
  game_id: string;
  market: string;
  bookmaker: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odds?: number;
  away_odds?: number;
  home_point?: number;
  away_point?: number;
  over_under?: number;
  raw_data: any;
}

export class OddsNormalizer {
  static normalize(apiResponse: OddsApiResponse[]): NormalizedOddsRecord[] {
    const records: NormalizedOddsRecord[] = [];

    for (const game of apiResponse) {
      console.log(`🔄 Processing game: ${game.away_team} @ ${game.home_team}`);
      
      for (const bookmaker of game.bookmakers) {
        for (const market of bookmaker.markets) {
          const baseRecord = {
            game_id: game.id,
            market: market.key,
            bookmaker: bookmaker.key,
            home_team: game.home_team,
            away_team: game.away_team,
            commence_time: game.commence_time,
            raw_data: {
              game,
              bookmaker: bookmaker.key,
              market: market.key,
              outcomes: market.outcomes
            }
          };

          if (market.key === 'h2h') {
            // Head-to-head (moneyline) odds
            const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
            const awayOutcome = market.outcomes.find(o => o.name === game.away_team);

            records.push({
              ...baseRecord,
              home_odds: homeOutcome?.price,
              away_odds: awayOutcome?.price,
            });

          } else if (market.key === 'spreads') {
            // Point spread odds
            const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
            const awayOutcome = market.outcomes.find(o => o.name === game.away_team);

            records.push({
              ...baseRecord,
              home_odds: homeOutcome?.price,
              away_odds: awayOutcome?.price,
              home_point: homeOutcome?.point,
              away_point: awayOutcome?.point,
            });

          } else if (market.key === 'totals') {
            // Over/Under totals
            const overOutcome = market.outcomes.find(o => o.name === 'Over');
            const underOutcome = market.outcomes.find(o => o.name === 'Under');

            records.push({
              ...baseRecord,
              home_odds: overOutcome?.price, // Over odds
              away_odds: underOutcome?.price, // Under odds  
              over_under: overOutcome?.point || underOutcome?.point,
            });
          }
        }
      }
    }

    console.log(`✅ Normalized ${records.length} odds records from ${apiResponse.length} games`);
    
    // Log sample normalized record
    if (records.length > 0) {
      console.log('📋 Sample normalized record:', JSON.stringify(records[0], null, 2));
    }

    return records;
  }

  static groupByGame(records: NormalizedOddsRecord[]): Map<string, NormalizedOddsRecord[]> {
    const gameMap = new Map<string, NormalizedOddsRecord[]>();
    
    for (const record of records) {
      if (!gameMap.has(record.game_id)) {
        gameMap.set(record.game_id, []);
      }
      gameMap.get(record.game_id)!.push(record);
    }

    return gameMap;
  }
} 