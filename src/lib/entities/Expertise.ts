import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Expertise list (dashboard-managed, shown on the homepage section).
 * Mirrors the old MySQL `expertise` table.
 */
@Entity("expertise")
export class Expertise {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "string", name: "title" })
  title!: string;

  @Column({ type: "int", name: "sort_order" })
  sort_order!: number;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}
