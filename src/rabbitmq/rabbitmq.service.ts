import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as amqplib from 'amqplib';
import { env } from '../config/env';
import {
  EXCHANGE_NAME,
  QueueJobData,
  QueueJobDataMap,
  QueueName,
} from './rabbitmq.types';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private model: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.model?.close();
  }

  private async connect() {
    try {
      this.model = await amqplib.connect(env.RABBITMQ_URL);
      this.channel = await this.model.createChannel();

      await this.channel.assertExchange(EXCHANGE_NAME, 'direct', {
        durable: true,
      });

      for (const queue of Object.values(QueueName)) {
        await this.channel.assertQueue(queue, { durable: true });
        await this.channel.bindQueue(queue, EXCHANGE_NAME, queue);
      }

      this.model.connection.on('error', (err: Error) => {
        this.logger.warn(`Connection error: ${err.message}`);
      });

      this.model.connection.on('close', () => {
        this.logger.warn('Connection closed, reconnecting in 5s...');
        setTimeout(() => void this.connect(), 5000);
      });

      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.warn(
        `Failed to connect to RabbitMQ: ${(error as Error).message}. Retrying in 5s...`,
      );
      setTimeout(() => void this.connect(), 5000);
    }
  }

  publish<Q extends QueueName>(queue: Q, data: QueueJobData<Q>): boolean {
    if (!this.channel) {
      this.logger.warn('Channel not ready, message dropped');
      return false;
    }

    return this.channel.publish(
      EXCHANGE_NAME,
      queue,
      Buffer.from(JSON.stringify(data)),
      { persistent: true },
    );
  }

  consume<Q extends QueueName>(
    queue: Q,
    handler: (data: QueueJobDataMap[Q]) => Promise<void>,
  ) {
    if (!this.channel) {
      this.logger.warn('Channel not ready, consumer not registered');
      return;
    }

    void this.channel.prefetch(1);
    void this.channel.consume(queue, (msg) => {
      if (!msg) return;

      void (async () => {
        try {
          const data = JSON.parse(msg.content.toString()) as QueueJobDataMap[Q];
          await handler(data);
          this.channel!.ack(msg);
        } catch (error) {
          this.logger.error(
            `Failed to process message from ${queue}: ${(error as Error).message}`,
          );
          this.channel!.nack(msg, false, false);
        }
      })();
    });
  }
}
