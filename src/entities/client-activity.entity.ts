import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Client } from './client.entity';

export type ClientActivityType =
  | 'created'
  | 'status_changed'
  | 'channel_toggled'
  | 'note';

@Entity('client_activities')
export class ClientActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_client_activities_clientId')
  @Column({ type: 'uuid' })
  clientId!: string;

  @ManyToOne(() => Client, (client) => client.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client!: Client;

  @Column({ type: 'varchar', length: 32 })
  type!: ClientActivityType;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdByName!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
