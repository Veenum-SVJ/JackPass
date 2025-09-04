import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Local Storage Keys
const STORAGE_KEYS = {
  USERS: 'jackpass_users',
  PROFILE_PICTURES: 'jackpass_profile_pictures',
  QUESTIONS: 'jackpass_questions',
  UPLOADS: 'jackpass_uploads',
} as const;

// User Profile Interface
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  university: string;
  department: string;
  level: number;
  bio: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

// Question Interface
export interface Question {
  id: string;
  title: string;
  institution: string;
  course: string;
  year: number;
  semester: 'First' | 'Second';
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  contentPreview: string;
  fullContent: string;
  fileUrl: string;
  createdAt: Date;
  uploaderId: string;
}

// Hybrid Storage Class
class HybridStorage {
  private isOnline = true;
  private isInitialized = false;

  constructor() {
    // Only initialize on the client side
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (this.isInitialized) return;
    
    // Check online status
    this.checkOnlineStatus();
    window.addEventListener('online', () => this.setOnlineStatus(true));
    window.addEventListener('offline', () => this.setOnlineStatus(false));
    
    this.isInitialized = true;
  }

  private checkOnlineStatus() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
    }
  }

  private setOnlineStatus(status: boolean) {
    this.isOnline = status;
    console.log(`Hybrid Storage: ${status ? 'Online' : 'Offline'} mode`);
  }

  // ===== USER MANAGEMENT =====

  async createUser(userData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const uid = this.generateUID();
    const now = new Date();
    
    const profile: UserProfile = {
      uid,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    // Temporarily disable Supabase to fix 404 errors
    // try {
    //   if (this.isOnline && supabaseUrl) {
    //     // Try Supabase first
    //     const { error } = await supabase
    //       .from('users')
    //       .insert([profile]);
        
    //     if (error) throw error;
    //     console.log('User created in Supabase');
    //   }
    // } catch (error) {
    //   console.log('Supabase failed, using local storage:', error);
    // }

    // Always save locally as backup
    this.saveUserLocally(profile);
    return profile;
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    // Temporarily disable Supabase to fix 404 errors
    // try {
    //   if (this.isOnline && supabaseUrl) {
    //     const { data, error } = await supabase
    //       .from('users')
    //       .select('*')
    //       .eq('email', email)
    //       .single();
      
    //     if (error) throw error;
    //     if (data) {
    //       console.log('User found in Supabase');
    //       return {
    //         ...data,
    //         createdAt: new Date(data.createdAt),
    //         updatedAt: new Date(data.updatedAt),
    //       };
    //     }
    //   }
    // } catch (error) {
    //   console.log('Supabase failed, using local storage:', error);
    // }

    // Fallback to local storage
    return this.getUserLocally(email);
  }

  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    try {
      if (this.isOnline && supabaseUrl) {
        // Try Supabase first
        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('uid', uid);
        
        if (error) throw error;
        console.log('User updated in Supabase');
      }
    } catch (error) {
      console.log('Supabase failed, updating local storage:', error);
    }

    // Always update locally as backup
    this.updateUserLocally(uid, updateData);
  }

  // ===== PROFILE PICTURE STORAGE =====

  async uploadProfilePicture(file: File, userId: string): Promise<string> {
    const fileName = `${userId}_${Date.now()}_${file.name}`;
    
    try {
      if (this.isOnline && supabaseUrl) {
        // Try Supabase Storage first
        const { data, error } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, file);
        
        if (data && !error) {
          const { data: urlData } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(fileName);
          
          if (urlData.publicUrl) {
            console.log('Profile picture uploaded to Supabase');
            return urlData.publicUrl;
          }
        }
      }
    } catch (error) {
      console.log('Supabase Storage failed, using local storage:', error);
    }

    // Fallback to local storage
    return this.uploadProfilePictureLocally(file, userId);
  }

  // ===== LOCAL STORAGE METHODS =====

  private saveUserLocally(user: UserProfile): void {
    if (typeof window === 'undefined') return;
    
    try {
      const users = this.getLocalUsers();
      users[user.uid] = user;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save user locally:', error);
    }
  }

  private getUserLocally(email: string): UserProfile | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const users = this.getLocalUsers();
      return Object.values(users).find(user => user.email === email) || null;
    } catch (error) {
      console.error('Failed to get user locally:', error);
      return null;
    }
  }

  private updateUserLocally(uid: string, updates: Partial<UserProfile>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const users = this.getLocalUsers();
      if (users[uid]) {
        users[uid] = { ...users[uid], ...updates };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    } catch (error) {
      console.error('Failed to update user locally:', error);
    }
  }

  private getLocalUsers(): Record<string, UserProfile> {
    if (typeof window === 'undefined') return {};
    
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get local users:', error);
      return {};
    }
  }

  private async uploadProfilePictureLocally(file: File, userId: string): Promise<string> {
    try {
      const reader = new FileReader();
      return new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          
          // Store in localStorage
          const pictures = this.getLocalProfilePictures();
          pictures[userId] = dataUrl;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.PROFILE_PICTURES, JSON.stringify(pictures));
          }
          
          resolve(dataUrl);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Failed to upload profile picture locally:', error);
      throw new Error('Failed to upload profile picture');
    }
  }

  private getLocalProfilePictures(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE_PICTURES);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get local profile pictures:', error);
      return {};
    }
  }

  // ===== UTILITY METHODS =====

  private generateUID(): string {
    return 'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ===== SYNC METHODS =====

  async syncToCloud(): Promise<void> {
    if (!this.isOnline || !supabaseUrl) return;

    try {
      const localUsers = this.getLocalUsers();
      
      for (const user of Object.values(localUsers)) {
        try {
          // Check if user exists in Supabase
          const { data } = await supabase
            .from('users')
            .select('uid')
            .eq('uid', user.uid)
            .single();
          
          if (!data) {
            // User doesn't exist in Supabase, create them
            await supabase.from('users').insert([user]);
            console.log(`Synced user ${user.email} to Supabase`);
          }
        } catch (error) {
          console.log(`Failed to sync user ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
    }
  }

  // ===== STATUS METHODS =====

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  getStorageInfo(): { online: boolean; localUsers: number; localPictures: number } {
    const localUsers = this.getLocalUsers();
    const localPictures = this.getLocalProfilePictures();
    
    return {
      online: this.isOnline,
      localUsers: Object.keys(localUsers).length,
      localPictures: Object.keys(localPictures).length,
    };
  }
}

// Create a lazy singleton instance
let hybridStorageInstance: HybridStorage | null = null;

function getHybridStorage(): HybridStorage {
  if (!hybridStorageInstance) {
    hybridStorageInstance = new HybridStorage();
  }
  return hybridStorageInstance;
}

// Export individual functions that safely access the instance
export const createUser = async (userData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> => {
  return getHybridStorage().createUser(userData);
};

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  return getHybridStorage().getUserByEmail(email);
};

export const updateUser = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  return getHybridStorage().updateUser(uid, updates);
};

export const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
  return getHybridStorage().uploadProfilePicture(file, userId);
};

export const syncToCloud = async (): Promise<void> => {
  return getHybridStorage().syncToCloud();
};

export const getOnlineStatus = (): boolean => {
  return getHybridStorage().getOnlineStatus();
};

export const getStorageInfo = (): { online: boolean; localUsers: number; localPictures: number } => {
  return getHybridStorage().getStorageInfo();
};

// Export the instance for direct access if needed
export const hybridStorage = getHybridStorage();
