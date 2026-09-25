import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Blog tags. Name is case-insensitively unique (enforced in actions),
 * slug is unique. Reuses the shared numeric auto-increment ids.
 */
@Entity("tags")
export class BlogTag {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "string", name: "name" })
  name!: string;

  @Column({ type: "string", name: "slug" })
  slug!: string;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}
