import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';
import { User } from './user.entity';

export enum MessageDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageDirection,
    default: MessageDirection.INCOMING,
  })
  direction: MessageDirection;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'respondedById' })
  respondedBy: User;

  @Column({ nullable: true })
  respondedById: number;

  @CreateDateColumn()
  createdAt: Date;
} 