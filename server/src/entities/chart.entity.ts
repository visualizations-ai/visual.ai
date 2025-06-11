import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity()
@Index(['userId'])
@Index(['projectId'])
@Index(['userId', 'projectId'])
@Index(['type'])
export class Chart {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'jsonb' })
  data: [number, number][];

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  projectId: string;

  // עמודות תויות - Supabase תומך ב-text arrays
  @Column({ type: 'text', array: true, nullable: true })
  labels?: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  categories?: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}