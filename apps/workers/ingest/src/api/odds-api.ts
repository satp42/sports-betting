import axios, { AxiosResponse } from 'axios';

export interface OddsApiResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string; // 'h2h', 'spreads', 'totals'
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

export class OddsApiClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.the-odds-api.com/v4';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchNbaOdds(): Promise<OddsApiResponse[]> {
    const url = `${this.baseUrl}/sports/basketball_nba/odds`;
    
    const params = {
      apiKey: this.apiKey,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'decimal',
      dateFormat: 'iso',
    };

    try {
      console.log('🏀 Fetching NBA odds from The Odds API...');
      console.log(`📍 URL: ${url}`);
      console.log(`📊 Markets: ${params.markets}`);

      const response: AxiosResponse<OddsApiResponse[]> = await axios.get(url, {
        params,
        timeout: 30000, // 30 second timeout
      });

      console.log(`✅ Successfully fetched ${response.data.length} games`);
      
      // Safely log API rate limit info
      const requestsRemaining = response.headers['x-requests-remaining'];
      const requestsReset = response.headers['x-requests-reset'];
      
      if (requestsRemaining) {
        console.log(`📈 API calls remaining: ${requestsRemaining}`);
      }
      
      if (requestsReset && !isNaN(Number(requestsReset))) {
        const resetDate = new Date(Number(requestsReset) * 1000);
        if (!isNaN(resetDate.getTime())) {
          console.log(`🔄 Next reset: ${resetDate.toISOString()}`);
        }
      }
      
      // Log sample response for debugging
      if (response.data.length > 0) {
        console.log('📋 Sample response:', JSON.stringify(response.data[0], null, 2));
      }

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Odds API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        throw new Error(`Odds API request failed: ${error.response?.status} ${error.response?.statusText}`);
      }
      
      console.error('❌ Unexpected error fetching odds:', error);
      throw error;
    }
  }
} 