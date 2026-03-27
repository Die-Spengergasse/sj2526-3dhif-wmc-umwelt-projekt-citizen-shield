import React from 'react';

export type PostType = 'critical' | 'info' | 'broadcast';

export interface Post {
  id: string;
  time: string;
  title: string;
  description: string;
  type: PostType;
  image?: string;
  tags?: string[];
  icon?: React.ReactNode;
  regionId: string;
}

export interface Region {
  id: string;
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
