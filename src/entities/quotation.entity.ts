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
import { decimalNumberTransformer } from '../common/typeorm/decimal.transformer';
import { QuotationItem } from './quotation-item.entity.js';
import { User } from './user.entity';

export type QuotationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

@Entity('quotations')
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_quotations_userId')
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  clientName!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  clientRut!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clientEmail!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  projectTitle!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  projectDeadline!: string | null;

  @Column({ type: 'text', nullable: true })
  projectNotes!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status!: QuotationStatus;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalNumberTransformer,
  })
  total!: number;

  @OneToMany(() => QuotationItem, 'quotation', {
    cascade: true,
    eager: true,
  })
  items!: QuotationItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
