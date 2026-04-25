/**
 * controllers/community.controller.ts
 * -----------------------------------
 * Community feed (posts + comments) and active challenges. Posts live in
 * the top-level "posts" collection, challenges in "challenges". Likes are
 * tracked via a likedBy[] array of user uids on each post doc.
 *
 * Contains:
 *   - getPosts()       feed with comments + per-user liked flag
 *   - createPost()     publish a new post
 *   - toggleLike()     like / unlike a post
 *   - addComment()     append a comment (stored as embedded array)
 *   - getChallenges()  list of active community challenges
 */

import { Request, Response } from 'express';
import { getDb, isFirebaseReady } from '../config/firebase.js';

/**
 * getPosts
 * No body. Returns all posts plus the per-user `liked` flag (resolved by
 * checking if the current user's uid is in each post's likedBy array).
 */
export async function getPosts(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid || '';
  const snapshot = await getDb().collection('posts').get();

  const posts = snapshot.docs.map(doc => {
    const data = doc.data();
    const likedBy: string[] = data.likedBy || [];
    return {
      id: doc.id,
      author: data.author,
      time: data.time,
      content: data.content,
      likes: data.likes || 0,
      comments: data.comments || [],
      liked: likedBy.includes(uid)
    };
  });

  res.json({ posts });
}

/**
 * createPost
 * Takes { content } in the body. Creates a new doc in "posts" and returns it.
 */
export async function createPost(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  const newPost = {
    author: req.user?.name || 'Anonymous',
    time: 'Just now',
    content,
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: new Date().toISOString()
  };

  const docRef = await getDb().collection('posts').add(newPost);
  res.status(201).json({
    post: { id: docRef.id, ...newPost, liked: false }
  });
}

/**
 * toggleLike
 * Takes :id in the URL. If the user's uid is in likedBy, remove it and
 * decrement likes. Otherwise add it and increment.
 */
export async function toggleLike(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const ref = getDb().collection('posts').doc(req.params.id);
  const doc = await ref.get();

  if (!doc.exists) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  const data = doc.data() as any;
  const likedBy: string[] = data.likedBy || [];
  const wasLiked = likedBy.includes(uid);

  const newLikedBy = wasLiked
    ? likedBy.filter(id => id !== uid)
    : [...likedBy, uid];
  const newLikes = (data.likes || 0) + (wasLiked ? -1 : 1);

  await ref.update({ likedBy: newLikedBy, likes: newLikes });

  res.json({ postId: req.params.id, liked: !wasLiked, likes: newLikes });
}

/**
 * addComment
 * Takes :id in the URL and { content } in the body. Appends to the post's
 * embedded comments array using arrayUnion.
 */
export async function addComment(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  const ref = getDb().collection('posts').doc(req.params.id);
  const doc = await ref.get();

  if (!doc.exists) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  const newComment = {
    id: Date.now(),
    author: req.user?.name || 'You',
    content,
    time: 'Just now'
  };

  // Read-modify-write: simpler than FieldValue.arrayUnion for embedded objects.
  const data = doc.data() as any;
  const updatedComments = [...(data.comments || []), newComment];
  await ref.update({ comments: updatedComments });

  res.status(201).json({ postId: req.params.id, comment: newComment });
}

/**
 * getChallenges
 * No body. Reads the "challenges" collection.
 */
export async function getChallenges(_req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const snapshot = await getDb().collection('challenges').get();
  const challenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json({ challenges });
}
