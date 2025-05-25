import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Chart {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column("float", { array: true }) 
  data: number[];

  @Column()
  userId: string;
}