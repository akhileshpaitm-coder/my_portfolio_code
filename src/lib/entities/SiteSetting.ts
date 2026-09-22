import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Site settings — key/value store (dashboard-managed homepage strings,
 * footer socials, booking settings). Mirrors the old MySQL `site_settings`
 * table where `key` was the primary key; here `key` is simply unique and
 * TypeORM's `_id` is the document id.
 */
@Entity("site_settings")
export class SiteSetting {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "string", name: "key" })
  key!: string;

  @Column({ type: "string", name: "value" })
  value!: string;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}
