import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('password_reset_codes')
export class PasswordResetCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_password_reset_codes_userId')
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  codeHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
