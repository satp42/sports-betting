import { IngestOrchestrator } from '../src/ingest-orchestrator';
import { OddsApiClient } from '../src/api/odds-api';
import { SupabaseIngestor } from '../src/database/supabase-client';
import { KafkaOddsProducer } from '../src/messaging/kafka-producer';

// Mock the dependencies
jest.mock('../src/api/odds-api');
jest.mock('../src/database/supabase-client');
jest.mock('../src/messaging/kafka-producer');

// Mock environment variables
process.env.THE_ODDS_API_KEY = 'test-api-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

describe('IngestOrchestrator', () => {
  let orchestrator: IngestOrchestrator;
  let mockOddsApi: jest.Mocked<OddsApiClient>;
  let mockSupabaseIngestor: jest.Mocked<SupabaseIngestor>;
  let mockKafkaProducer: jest.Mocked<KafkaOddsProducer>;

  const mockOddsApiResponse = [
    {
      id: 'game-123',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: '2024-01-15T19:00:00Z',
      home_team: 'Los Angeles Lakers',
      away_team: 'Boston Celtics',
      bookmakers: [
        {
          key: 'fanduel',
          title: 'FanDuel',
          last_update: '2024-01-15T18:00:00Z',
          markets: [
            {
              key: 'h2h',
              last_update: '2024-01-15T18:00:00Z',
              outcomes: [
                { name: 'Los Angeles Lakers', price: 1.95 },
                { name: 'Boston Celtics', price: 1.87 }
              ]
            }
          ]
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockOddsApi = {
      fetchNbaOdds: jest.fn(),
    } as any;

    mockSupabaseIngestor = {
      healthCheck: jest.fn(),
      insertOddsData: jest.fn(),
      insertGames: jest.fn(),
      insertOddsSnapshots: jest.fn(),
    } as any;

    mockKafkaProducer = {
      publishOddsUpdates: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn(),
      healthCheck: jest.fn(),
    } as any;

    // Mock constructors
    (OddsApiClient as jest.MockedClass<typeof OddsApiClient>).mockImplementation(() => mockOddsApi);
    (SupabaseIngestor as jest.MockedClass<typeof SupabaseIngestor>).mockImplementation(() => mockSupabaseIngestor);
    (KafkaOddsProducer as jest.MockedClass<typeof KafkaOddsProducer>).mockImplementation(() => mockKafkaProducer);

    orchestrator = new IngestOrchestrator();
  });

  describe('runIngestCycle', () => {
    it('should complete a full ingestion cycle with mocked HTTP requests', async () => {
      // Arrange
      mockSupabaseIngestor.healthCheck.mockResolvedValue(true);
      mockOddsApi.fetchNbaOdds.mockResolvedValue(mockOddsApiResponse);
      mockSupabaseIngestor.insertOddsData.mockResolvedValue();
      mockKafkaProducer.publishOddsUpdates.mockResolvedValue();

      // Act
      await orchestrator.runIngestCycle();

      // Assert - verify exactly one Supabase insert per call
      expect(mockSupabaseIngestor.healthCheck).toHaveBeenCalledTimes(1);
      expect(mockOddsApi.fetchNbaOdds).toHaveBeenCalledTimes(1);
      expect(mockSupabaseIngestor.insertOddsData).toHaveBeenCalledTimes(1);
      expect(mockKafkaProducer.publishOddsUpdates).toHaveBeenCalledTimes(1);

      // Verify the data passed to insertOddsData
      const insertCall = mockSupabaseIngestor.insertOddsData.mock.calls[0];
      expect(insertCall[0]).toHaveLength(1); // Should have 1 normalized record
      expect(insertCall[0][0]).toMatchObject({
        game_id: 'game-123',
        market: 'h2h',
        bookmaker: 'fanduel',
        home_team: 'Los Angeles Lakers',
        away_team: 'Boston Celtics',
      });
    });

    it('should handle empty API response gracefully', async () => {
      // Arrange
      mockSupabaseIngestor.healthCheck.mockResolvedValue(true);
      mockOddsApi.fetchNbaOdds.mockResolvedValue([]);

      // Act
      await orchestrator.runIngestCycle();

      // Assert
      expect(mockSupabaseIngestor.healthCheck).toHaveBeenCalledTimes(1);
      expect(mockOddsApi.fetchNbaOdds).toHaveBeenCalledTimes(1);
      expect(mockSupabaseIngestor.insertOddsData).not.toHaveBeenCalled();
      expect(mockKafkaProducer.publishOddsUpdates).not.toHaveBeenCalled();
    });

    it('should throw error when database health check fails', async () => {
      // Arrange
      mockSupabaseIngestor.healthCheck.mockResolvedValue(false);

      // Act & Assert
      await expect(orchestrator.runIngestCycle()).rejects.toThrow('Database health check failed');
      
      expect(mockSupabaseIngestor.healthCheck).toHaveBeenCalledTimes(1);
      expect(mockOddsApi.fetchNbaOdds).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      mockSupabaseIngestor.healthCheck.mockResolvedValue(true);
      mockOddsApi.fetchNbaOdds.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(orchestrator.runIngestCycle()).rejects.toThrow('API Error');
      
      expect(mockSupabaseIngestor.healthCheck).toHaveBeenCalledTimes(1);
      expect(mockOddsApi.fetchNbaOdds).toHaveBeenCalledTimes(1);
      expect(mockSupabaseIngestor.insertOddsData).not.toHaveBeenCalled();
    });

    it('should handle Supabase insert errors', async () => {
      // Arrange
      mockSupabaseIngestor.healthCheck.mockResolvedValue(true);
      mockOddsApi.fetchNbaOdds.mockResolvedValue(mockOddsApiResponse);
      mockSupabaseIngestor.insertOddsData.mockRejectedValue(new Error('Database Error'));

      // Act & Assert
      await expect(orchestrator.runIngestCycle()).rejects.toThrow('Database Error');
      
      expect(mockSupabaseIngestor.insertOddsData).toHaveBeenCalledTimes(1);
      expect(mockKafkaProducer.publishOddsUpdates).not.toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should disconnect from Kafka gracefully', async () => {
      // Arrange
      mockKafkaProducer.disconnect.mockResolvedValue();

      // Act
      await orchestrator.shutdown();

      // Assert
      expect(mockKafkaProducer.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle Kafka disconnect errors', async () => {
      // Arrange
      mockKafkaProducer.disconnect.mockRejectedValue(new Error('Kafka Error'));

      // Act & Assert - should not throw
      await orchestrator.shutdown();
      
      expect(mockKafkaProducer.disconnect).toHaveBeenCalledTimes(1);
    });
  });
}); 