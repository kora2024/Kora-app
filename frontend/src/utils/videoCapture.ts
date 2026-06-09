/**
 * KORA Video Capture & Upload
 * 
 * Capture vidéo pour Éclats Visuels
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { KoraContent, ContentFormat, FORMAT_LIMITS } from '../types/streaming';

// ══════════════════════════════════════════════════════════════════════════════
// STORAGE
// ══════════════════════════════════════════════════════════════════════════════

const VIDEO_CONTENT_KEY = 'kora_video_content';
const VIDEO_DIR = FileSystem.documentDirectory + 'kora_videos/';

// ══════════════════════════════════════════════════════════════════════════════
// VIDEO CAPTURE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Request camera permissions
 */
export async function requestVideoPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
  const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  return cameraStatus === 'granted' && mediaStatus === 'granted';
}

/**
 * Record a video
 */
export async function recordVideo(maxDurationSec: number = 60): Promise<string | null> {
  try {
    const hasPermission = await requestVideoPermissions();
    if (!hasPermission) {
      console.log('Video permissions denied');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: maxDurationSec,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error recording video:', error);
    return null;
  }
}

/**
 * Pick a video from library
 */
export async function pickVideo(): Promise<{ uri: string; duration: number } | null> {
  try {
    const hasPermission = await requestVideoPermissions();
    if (!hasPermission) {
      console.log('Video permissions denied');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      duration: asset.duration || 0,
    };
  } catch (error) {
    console.error('Error picking video:', error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// VIDEO STORAGE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Save video to local storage
 */
export async function saveVideo(
  sourceUri: string,
  metadata: {
    title: string;
    description?: string;
    territoryId: string;
    territoryName: string;
    creatorId: string;
    creatorName: string;
    duration: number;
    format: ContentFormat;
    tags?: string[];
  }
): Promise<KoraContent | null> {
  try {
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(VIDEO_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VIDEO_DIR, { intermediates: true });
    }

    // Generate unique filename
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const extension = sourceUri.split('.').pop() || 'mp4';
    const localPath = `${VIDEO_DIR}${videoId}.${extension}`;

    // Copy file to app storage
    await FileSystem.copyAsync({
      from: sourceUri,
      to: localPath,
    });

    // Create content object
    const content: KoraContent = {
      id: videoId,
      type: 'video',
      format: metadata.format,
      creatorId: metadata.creatorId,
      creatorName: metadata.creatorName,
      territoryId: metadata.territoryId,
      territoryName: metadata.territoryName,
      mediaUrl: localPath,
      duration: metadata.duration,
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags || [],
      views: 0,
      likes: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    };

    // Save to storage
    const existing = await getVideoContent();
    existing.push(content);
    await AsyncStorage.setItem(VIDEO_CONTENT_KEY, JSON.stringify(existing));

    console.log('📹 Video saved:', videoId);
    return content;
  } catch (error) {
    console.error('Error saving video:', error);
    return null;
  }
}

/**
 * Get all video content
 */
export async function getVideoContent(): Promise<KoraContent[]> {
  try {
    const data = await AsyncStorage.getItem(VIDEO_CONTENT_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get videos by territory
 */
export async function getVideosByTerritory(territoryId: string): Promise<KoraContent[]> {
  const all = await getVideoContent();
  return all.filter(v => v.territoryId === territoryId);
}

/**
 * Delete a video
 */
export async function deleteVideo(videoId: string): Promise<boolean> {
  try {
    const existing = await getVideoContent();
    const video = existing.find(v => v.id === videoId);
    
    if (video) {
      // Delete file
      await FileSystem.deleteAsync(video.mediaUrl, { idempotent: true });
      
      // Update storage
      const filtered = existing.filter(v => v.id !== videoId);
      await AsyncStorage.setItem(VIDEO_CONTENT_KEY, JSON.stringify(filtered));
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
}

/**
 * Increment view count
 */
export async function incrementViews(videoId: string): Promise<void> {
  try {
    const existing = await getVideoContent();
    const index = existing.findIndex(v => v.id === videoId);
    
    if (index !== -1) {
      existing[index].views += 1;
      await AsyncStorage.setItem(VIDEO_CONTENT_KEY, JSON.stringify(existing));
    }
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FORMAT VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get format based on duration
 */
export function getFormatForDuration(durationSec: number): ContentFormat {
  if (durationSec <= 60) return 'flash';
  if (durationSec <= 300) return 'regard';
  if (durationSec <= 1200) return 'recit';
  return 'oeuvre';
}

/**
 * Check if format requires premium
 */
export function formatRequiresPremium(format: ContentFormat): boolean {
  return FORMAT_LIMITS[format].premium;
}
