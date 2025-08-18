// User types
export interface User {
  id: string;
  email: string;
  username: string;
  bio?: string;
  profile_picture?: string;
  website?: string;
  is_private: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UserProfile extends User {
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
  user: User;
}

// Post types
export interface Post {
  id: string;
  caption?: string;
  location?: string;
  created_at: string;
  user: User;
  images: PostImage[];
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface PostImage {
  id: string;
  image_url: string;
  position: number;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: User;
  likes_count: number;
  is_liked: boolean;
  replies?: Comment[];
}

export interface Story {
  id: string;
  user: User;
  items: StoryItem[];
  unviewed_count: number;
}

export interface StoryItem {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  is_viewed: boolean;
}

// Saved Post types
export interface SavedPost {
  user_id: string;
  post_id: string;
  created_at: string;
  post?: Post;
}