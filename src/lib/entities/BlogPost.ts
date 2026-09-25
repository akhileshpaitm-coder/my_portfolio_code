import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Blog posts. `content` is sanitized HTML (the output of the admin editor).
 * `author_id` references the existing users collection (users.id) — no new
 * users table. Slug is unique; status is "draft" | "published".
 */
@Entity("posts")
export class BlogPost {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "string", name: "title" })
  title!: string;

  @Column({ type: "string", name: "slug" })
  slug!: string;

  @Column({ type: "string", name: "excerpt" })
  excerpt!: string;

  /** Sanitized rich-text HTML from the admin editor. */
  @Column({ type: "string", name: "content" })
  content!: string;

  @Column({ type: "string", name: "featured_image", nullable: true })
  featured_image!: string | null;

  /** Existing users.id (dashboard admin). */
  @Column({ type: "int", name: "author_id" })
  author_id!: number;

  @Column({ type: "int", name: "category_id", nullable: true })
  category_id!: number | null;

  @Column({ type: "string", name: "status" })
  status!: "draft" | "published";

  /** Set when the post transitions to published; null for drafts. */
  @Column({ type: "date", name: "published_at", nullable: true })
  published_at!: Date | null;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}
