import { Kafka, Producer, KafkaConfig } from 'kafkajs';
import { NormalizedOddsRecord } from '../processors/odds-normalizer';

export class KafkaOddsProducer {
  private kafka: Kafka;
  private producer: Producer;
  private connected = false;

  constructor(brokers: string[] = ['localhost:9092']) {
    const kafkaConfig: KafkaConfig = {
      clientId: 'odds-ingest-worker',
      brokers,
      retry: {
        initialRetryTime: 1000,
        retries: 5,
      },
    };

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      console.log('🔌 Connecting to Kafka...');
      await this.producer.connect();
      this.connected = true;
      console.log('✅ Successfully connected to Kafka');
    } catch (error) {
      console.error('❌ Failed to connect to Kafka:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.connected = false;
      console.log('🔌 Disconnected from Kafka');
    } catch (error) {
      console.error('❌ Error disconnecting from Kafka:', error);
    }
  }

  async publishOddsUpdates(oddsRecords: NormalizedOddsRecord[]): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    if (oddsRecords.length === 0) {
      console.log('📭 No odds updates to publish');
      return;
    }

    console.log(`📤 Publishing ${oddsRecords.length} odds updates to Kafka topic: odds.updates`);

    try {
      // Group records by game for better message organization
      const messagesByGame = new Map<string, NormalizedOddsRecord[]>();
      
      for (const record of oddsRecords) {
        if (!messagesByGame.has(record.game_id)) {
          messagesByGame.set(record.game_id, []);
        }
        messagesByGame.get(record.game_id)!.push(record);
      }

      const messages = Array.from(messagesByGame.entries()).map(([gameId, records]) => ({
        key: gameId,
        value: JSON.stringify({
          gameId,
          timestamp: new Date().toISOString(),
          oddsCount: records.length,
          records,
        }),
        timestamp: Date.now().toString(),
      }));

      const result = await this.producer.send({
        topic: 'odds.updates',
        messages,
      });

      console.log(`✅ Successfully published ${messages.length} game updates to Kafka`);
      console.log(`📊 Kafka response:`, {
        topicPartitions: result.map(r => ({
          topic: r.topicName,
          partition: r.partition,
          offset: r.baseOffset,
        }))
      });

    } catch (error) {
      console.error('❌ Error publishing to Kafka:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.connected) {
        await this.connect();
      }

      // Send a test message to verify connectivity
      await this.producer.send({
        topic: 'odds.updates',
        messages: [{
          key: 'health-check',
          value: JSON.stringify({
            type: 'health-check',
            timestamp: new Date().toISOString(),
          }),
        }],
      });

      console.log('✅ Kafka connection healthy');
      return true;
    } catch (error) {
      console.error('❌ Kafka health check failed:', error);
      return false;
    }
  }
} 