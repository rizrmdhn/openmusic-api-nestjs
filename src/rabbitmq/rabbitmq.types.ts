export const EXCHANGE_NAME = 'openmusic';

export const QueueName = {
  EXPORT_PLAYLIST: 'export:playlist',
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

export interface QueueJobDataMap {
  [QueueName.EXPORT_PLAYLIST]: {
    targetEmail: string;
    playlist: {
      id: string;
      name: string;
      songs: { id: string; title: string; performer: string }[];
    };
  };
}

export type QueueJobData<Q extends QueueName> = QueueJobDataMap[Q];
