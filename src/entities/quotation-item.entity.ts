import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { decimalNumberTransformer } from '../common/typeorm/decimal.transformer';
import { Quotation } from './quotation.entity';

@Entity('quotation_items')
export class QuotationItem {
  @PrimaryColumn({ type: 'uuid' })
  quotationId!: string;

  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'int' })
  position!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  unitPrice!: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  subtotal!: number;

  @ManyToOne(() => Quotation, 'items', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotationId' })
  quotation!: Quotation;
}
