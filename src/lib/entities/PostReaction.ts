import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Post reactions (post_reactions). One row per (post_id, user_id) — the
 * unique pair index (created by the migration) guarantees a user can only
 * have a single like OR dislike per post. reaction_type: "like" | "dislike".
 */
@Entity("post_reactions")
export class PostReaction {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "int", name: "post_id" })
  post_id!: number;

  @Column({ type: "int", name: "user_id" })
  user_id!: number;

  @Column({ type: "string", name: "reaction_type" })
  reaction_type!: "like" | "dislike";

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;
}
