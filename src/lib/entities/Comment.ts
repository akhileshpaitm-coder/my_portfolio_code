import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Blog comments (threaded — parent_id is null for top-level comments,
 * otherwise the parent comment's id). `user_id` references the existing
 * users collection (users.id).
 */
@Entity("comments")
export class Comment {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "int", name: "post_id" })
  post_id!: number;

  @Column({ type: "int", name: "user_id" })
  user_id!: number;

  /** Parent comment id for replies; null for top-level comments. */
  @Column({ type: "int", name: "parent_id", nullable: true })
  parent_id!: number | null;

  @Column({ type: "string", name: "content" })
  content!: string;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}
