import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Auto-increment counters for numeric ids (replaces MySQL AUTO_INCREMENT).
 * One document per collection: { _id, seq }.
 */
@Entity("counters")
export class Counter {
  @ObjectIdColumn()
  _id!: ObjectId;

  /** Collection name this counter is for (unique). */
  @Column({ type: "string", name: "key" })
  key!: string;

  @Column({ type: "int", name: "seq" })
  seq!: number;
}
