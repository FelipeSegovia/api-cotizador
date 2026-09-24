import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { ClientActivity } from './client-activity.entity';
import { User } from './user.entity';

export type ClientStatus = 'not_contacted' | 'approved' | 'rejected';

export interface ClientContacts {
  email: boolean;
  phone: boolean;
  whatsapp: boolean;
}

export const DEFAULT_CLIENT_CONTACTS: ClientContacts = {
  email: false,
  phone: false,
  whatsapp: false,
};

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_clients_companyId')
  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser!: User | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'not_contacted' })
  status!: ClientStatus;

  @Column({ type: 'jsonb', default: DEFAULT_CLIENT_CONTACTS })
  contacts!: ClientContacts;

  @OneToMany(() => ClientActivity, (activity) => activity.client, {
    cascade: true,
    eager: true,
  })
  activities!: ClientActivity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
