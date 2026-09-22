import type { Document } from "mongodb";
import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * "Core Values" highlight card items (dashboard-managed, homepage section).
 * Mirrors the old MySQL `core_values` table.
 */
@Entity("core_values")
export class CoreValue {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  /** Emoji shown before the title. */
  @Column({ type: "string", name: "icon" })
  icon!: string;

  @Column({ type: "string", name: "title" })
  title!: string;

  @Column({ type: "string", name: "description" })
  description!: string;

  @Column({ type: "int", name: "sort_order" })
  sort_order!: number;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}

export interface CoreValueStored extends Document, CoreValue {}
