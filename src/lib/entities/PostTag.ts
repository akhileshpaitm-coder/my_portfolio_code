import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Post ↔ tag join (post_tags). Mirrors the old relational post_tags table:
 * { post_id, tag_id } with a unique pair index (created by the migration).
 */
@Entity("post_tags")
export class PostTag {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "post_id" })
  post_id!: number;

  @Column({ type: "int", name: "tag_id" })
  tag_id!: number;
}
