import React from 'react';

export type PostType = 'critical' | 'info' | 'broadcast';

export interface Voter {
  id: string;
  displayName: string;
  isVerified: boolean;
}

export interface Post {
  id: string;
  regionId: string;
  time: string;
  title: string;
  description: string;
  type: PostType;
  image?: string;
  images?: string[];
  tags?: string[];
  icon?: React.ReactNode;
  upvoteCount: number;
  downvoteCount: number;
  userVote?: 'upvote' | 'downvote' | null;
  upvoters?: Voter[];
  downvoters?: Voter[];
  author?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  createdAt?: string;
}

export interface Region {
  id: string;
  slug: string;
  name: string;
  intensity: 'CRITICAL' | 'HIGH' | 'STABLE' | 'ALERT';
  activeHubs: number;
  connectivity: number;
  description: string;
  image: string;
  mapImage: string;
  localInfo: {
    emergencyContact: string;
    safeZones: string[];
    resources: string[];
  };
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
  _at?: number;
}

export interface Comment {
  id: string;
  userId: string;
  name: string;
  text: string;
  time: string;
  isVerified: boolean;
}

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  isVerified: boolean;
  stats: {
    totalPosts: number;
    totalUpvotesReceived: number;
  };
}
