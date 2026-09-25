/**
 * Shared blog types — importable from both server and client code
 * (no "server-only" imports here).
 */

export type PostStatus = "draft" | "published";

export interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  author_id: number;
  author_name: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  tags: Array<{ id: number; name: string; slug: string }>;
  status: PostStatus;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  like_count: number;
  dislike_count: number;
  comment_count: number;
}

/** Full post with rich-text content (sanitized HTML). */
export interface BlogPostFull extends BlogPostSummary {
  content: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface BlogUser {
  id: number;
  name: string;
  email?: string;
}

export interface BlogComment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  parent_id: number | null;
  content: string;
  created_at: Date;
  updated_at: Date;
}

/** A comment tree node (children nested). */
export interface CommentNode extends BlogComment {
  replies: CommentNode[];
}

export type ReactionType = "like" | "dislike";

export interface ReactionCounts {
  likes: number;
  dislikes: number;
}

/** Query options for the public/admin post listing. */
export interface PostListOptions {
  search?: string;
  categoryId?: number | null;
  tagSlug?: string;
  status?: PostStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface PostListResult {
  posts: BlogPostSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
