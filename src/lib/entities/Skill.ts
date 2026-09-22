import type { Document } from "mongodb";
import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Skills (dashboard-managed, shown on /skills and the homepage section).
 * Mirrors the old MySQL `skills` table.
 */
@Entity("skills")
export class Skill {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "string", name: "category" })
  category!: string;

  @Column({ type: "string", name: "name" })
  name!: string;

  @Column({ type: "int", name: "sort_order" })
  sort_order!: number;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}

export interface SkillStored extends Document, Skill {}
