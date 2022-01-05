import { Field, Int, ObjectType } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

// ==================
//   DATABASE Model
// ==================

@ObjectType() // initialize data-type
@Entity('users')
export class User extends BaseEntity {
  @Field(() => Int) // expose the data (type of it)
  @PrimaryGeneratedColumn()
  id: number;

  @Field() // exposing the data (type of it)
  @Column('text')
  email: string;

  @Column('text')
  password: string;

  @Column('int', { default: 0 })
  tokenVersion: number;
}
