import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Application users (dashboard login).
 * Mirrors the old MySQL `users` table — same columns/semantics, now documents.
 * `id` is a numeric auto-increment (assigned via the `counters` collection).
 */
@Entity("users")
export class User {
  @ObjectIdColumn()
  _id!: ObjectId;

  /** Numeric auto-increment id (mirrors the old MySQL PK). */
  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "string", name: "name" })
  name!: string;

  @Column({ type: "string", name: "email" })
  email!: string;

  @Column({ type: "string", name: "password_hash" })
  password_hash!: string;

  @Column({ type: "string", name: "role" })
  role!: "admin" | "user";

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}
