import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNativeDb } from "@/lib/db";
import { createComment, updateComment, deleteComment, countComments } from "@/lib/blog-comments";

/**
 * POST /api/blog/comments — add a comment (or reply) as the logged-in user.
 * Body: { postId, content, parentId? }.
 * PATCH  — edit own comment. Body: { id, content }.
 * DELETE — delete own comment (admins may delete any). Body: { id }.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to comment." },
      { status: 401 }
    );
  }

  let body: { postId?: unknown; content?: unknown; parentId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const postId = Number(body.postId);
  const parentId =
    body.parentId === undefined || body.parentId === null ? null : Number(body.parentId);
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }
  if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
    return NextResponse.json({ error: "Invalid parent comment." }, { status: 400 });
  }
  if (content.length < 2) {
    return NextResponse.json({ error: "Comment must be at least 2 characters." }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "Comment must be 2000 characters or fewer." }, { status: 400 });
  }

  try {
    const db = await getNativeDb();
    const post = await db.collection("posts").findOne(
      { id: postId, status: "published" },
      { projection: { _id: 1 } }
    );
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // Validate the parent belongs to the same post (thread integrity).
    if (parentId !== null) {
      const parent = await db.collection("comments").findOne(
        { id: parentId, post_id: postId },
        { projection: { _id: 1 } }
      );
      if (!parent) {
        return NextResponse.json(
          { error: "The comment you replied to no longer exists." },
          { status: 400 }
        );
      }
    }

    const id = await createComment({
      post_id: postId,
      user_id: Number(session.user.id),
      parent_id: parentId,
      content,
    });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[blog/comments] create failed:", error);
    return NextResponse.json({ error: "Could not post your comment." }, { status: 500 });
  }
}

/** Edit the viewer's own comment. */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: { id?: unknown; content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = Number(body.id);
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid comment id." }, { status: 400 });
  }
  if (content.length < 2 || content.length > 2000) {
    return NextResponse.json(
      { error: "Comment must be 2–2000 characters." },
      { status: 400 }
    );
  }

  try {
    const ok = await updateComment(id, Number(session.user.id), content);
    if (!ok) {
      return NextResponse.json(
        { error: "Comment not found (or it is not yours to edit)." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[blog/comments] edit failed:", error);
    return NextResponse.json({ error: "Could not update the comment." }, { status: 500 });
  }
}

/** Delete the viewer's own comment; admins may delete any. Replies survive. */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid comment id." }, { status: 400 });
  }

  try {
    const db = await getNativeDb();
    const comment = await db.collection("comments").findOne(
      { id },
      { projection: { _id: 0, user_id: 1, post_id: 1 } }
    );
    if (!comment) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin";
    const isOwner = Number(session.user.id) === Number(comment.user_id);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "You can only delete your own comments." }, { status: 403 });
    }

    const ok = await deleteComment(id);
    if (!ok) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

    return NextResponse.json({
      success: true,
      removed: 1,
      commentCount: await countComments(Number(comment.post_id)),
    });
  } catch (error) {
    console.error("[blog/comments] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the comment." }, { status: 500 });
  }
}
