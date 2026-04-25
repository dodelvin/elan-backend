/**
 * utils/seed.ts
 * -------------
 * One-shot Firestore seeder. Populates the public-read collections that
 * back the Workout, Meditation, Shop, and Community screens.
 *
 * Run with: npm run seed
 *
 * Safe to run multiple times — uses set() with deterministic doc ids so
 * subsequent runs overwrite (rather than duplicate) the records.
 *
 * Contains:
 *   - main()          orchestrates the four seed batches
 *   - seedCollection()  generic helper: writes a list of {id, ...data} docs
 */

import dotenv from 'dotenv';
import { initFirebase, getDb, isFirebaseReady } from '../config/firebase.js';

dotenv.config();
initFirebase();

if (!isFirebaseReady()) {
  console.error('[seed] Firebase not initialised — set FIREBASE_SERVICE_ACCOUNT_PATH in .env');
  process.exit(1);
}

const db = getDb();

// Variables related to the workout catalog seed data.
const workouts = [
  { id: '1', title: 'Morning Yoga Flow',   category: 'Yoga',        level: 'Beginner',     duration: '30 min', calories: '180 cal', description: 'Gentle morning routine to energize your day' },
  { id: '2', title: 'HIIT Cardio Blast',   category: 'Cardio',      level: 'Intermediate', duration: '20 min', calories: '350 cal', description: 'High intensity workout for maximum burn' },
  { id: '3', title: 'Strength Training',   category: 'Strength',    level: 'Advanced',     duration: '45 min', calories: '280 cal', description: 'Full body strength and conditioning' },
  { id: '4', title: 'Evening Stretch',     category: 'Flexibility', level: 'All Levels',   duration: '15 min', calories: '80 cal',  description: 'Relaxing stretches to wind down' }
];

// Variables related to the meditation catalog seed data.
const meditations = [
  { id: '1', title: 'Morning Mindfulness', category: 'Mindfulness', duration: '10 min', description: 'Start your day with clarity and intention',     audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Deep Breathing',      category: 'Breathing',   duration: '5 min',  description: 'Focused breathing for calm and balance',         audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Body Scan',           category: 'Relaxation',  duration: '15 min', description: 'Release tension and reconnect with your body',   audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: '4', title: 'Sleep Meditation',    category: 'Sleep',       duration: '20 min', description: 'Drift into peaceful, restorative sleep',         audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
];

// Variables related to the shop product catalog.
const products = [
  { id: '1', name: 'Organic Green Tea',  price: 24.99, rating: 4.8, reviews: 124, category: 'Wellness'    },
  { id: '2', name: 'Premium Yoga Mat',   price: 89.99, rating: 4.9, reviews: 256, category: 'Fitness'     },
  { id: '3', name: 'Superfood Protein',  price: 49.99, rating: 4.7, reviews: 189, category: 'Nutrition'   },
  { id: '4', name: 'Meditation Cushion', price: 64.99, rating: 4.9, reviews: 342, category: 'Mindfulness' },
  { id: '5', name: 'Essential Oil Set',  price: 34.99, rating: 4.6, reviews: 98,  category: 'Wellness'    },
  { id: '6', name: 'Resistance Bands',   price: 29.99, rating: 4.8, reviews: 276, category: 'Fitness'     }
];

// Variables related to active community challenges.
const challenges = [
  { id: '1', title: '30-Day Yoga',      members: 234, daysLeft: 12 },
  { id: '2', title: 'Hydration Hero',   members: 567, daysLeft: 5  },
  { id: '3', title: 'Mindful November', members: 892, daysLeft: 18 }
];

// Variables related to the seed community feed posts.
// Comments are stored as an embedded array on the post doc — simpler queries.
const posts = [
  {
    id: '1', author: 'Emily Chen', time: '2h ago',
    content: 'Just completed my 30-day meditation streak! Feeling more centered and peaceful than ever. Remember: consistency is key! 🧘‍♀️',
    likes: 42, likedBy: [],
    comments: [
      { id: 1, author: 'John Doe', content: 'Amazing work! Keep it up! 💪', time: '1h ago'  },
      { id: 2, author: 'Sarah M',  content: 'Inspiring! I need to start my streak too.', time: '45m ago' }
    ]
  },
  {
    id: '2', author: 'Michael Roberts', time: '4h ago',
    content: 'Morning workout complete! Started my day with a 5km run and some yoga. The sunrise was absolutely beautiful. Who else is crushing their fitness goals today?',
    likes: 67, likedBy: [],
    comments: [
      { id: 1, author: 'Lisa K', content: 'Way to go! Early morning workouts are the best.', time: '3h ago' }
    ]
  },
  {
    id: '3', author: 'Sarah Thompson', time: '6h ago',
    content: 'Meal prep Sunday! Prepared healthy meals for the entire week. Sharing my favorite quinoa bowl recipe in the comments. Nutrition is self-care! 🥗',
    likes: 89, likedBy: [],
    comments: [
      { id: 1, author: 'Mike R', content: 'Would love that recipe!', time: '5h ago' },
      { id: 2, author: 'Sarah Thompson', content: 'Recipe: Quinoa, roasted veggies, chickpeas, tahini dressing!', time: '5h ago' }
    ]
  },
  {
    id: '4', author: 'David Kim', time: '1d ago',
    content: 'Hit a new personal record on my deadlift today! All the hard work is paying off. Remember: progress over perfection!',
    likes: 103, likedBy: [], comments: []
  }
];

/**
 * seedCollection
 * Takes a Firestore collection name and an array of {id, ...data} objects.
 * Writes each entry with set() using the supplied id, so re-runs overwrite
 * rather than duplicate. Returns void.
 */
async function seedCollection<T extends { id: string }>(name: string, items: T[]): Promise<void> {
  console.log(`[seed] writing ${items.length} docs into "${name}"...`);
  const batch = db.batch();
  for (const item of items) {
    const { id, ...data } = item;
    batch.set(db.collection(name).doc(id), data);
  }
  await batch.commit();
  console.log(`[seed]   ✓ ${name} done`);
}

/**
 * main
 * Runs all four seed batches in sequence. Exits with code 0 on success,
 * 1 on any error.
 */
async function main(): Promise<void> {
  console.log('[seed] starting Firestore seed…');
  try {
    await seedCollection('workouts',    workouts);
    await seedCollection('meditations', meditations);
    await seedCollection('products',    products);
    await seedCollection('challenges',  challenges);
    await seedCollection('posts',       posts);
    console.log('[seed] ✅ all done');
    process.exit(0);
  } catch (err) {
    console.error('[seed] ❌ failed:', err);
    process.exit(1);
  }
}

main();
