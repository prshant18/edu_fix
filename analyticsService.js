
import { useToast } from '@/components/ui/use-toast';

export const calculateUserProgress = (userId) => {
  try {
    // Get all user activities
    const videos = JSON.parse(localStorage.getItem(`videos_${userId}`) || '[]');
    const materials = JSON.parse(localStorage.getItem(`materials_${userId}`) || '[]');
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]')
      .filter(a => a.studentId === userId);
    const studySessions = JSON.parse(localStorage.getItem(`studySessions_${userId}`) || '[]');

    // Calculate video progress
    const videoProgress = {
      total: videos.length,
      completed: videos.filter(v => v.completed).length,
      watchTime: videos.reduce((acc, v) => acc + (v.watchTime || 0), 0)
    };

    // Calculate reference materials progress
    const materialsProgress = {
      total: materials.length,
      accessed: materials.filter(m => m.lastAccessed).length,
      annotations: Object.values(JSON.parse(localStorage.getItem(`annotations_${userId}`) || '{}')).flat().length
    };

    // Calculate assignment progress
    const assignmentProgress = {
      total: assignments.length,
      completed: assignments.filter(a => a.completed).length,
      onTime: assignments.filter(a => a.completed && new Date(a.completedAt) <= new Date(a.deadline)).length
    };

    // Calculate study time
    const studyProgress = {
      totalSessions: studySessions.length,
      totalTime: studySessions.reduce((acc, s) => acc + s.duration, 0),
      averageSessionLength: studySessions.length > 0 
        ? studySessions.reduce((acc, s) => acc + s.duration, 0) / studySessions.length 
        : 0
    };

    return {
      videos: videoProgress,
      materials: materialsProgress,
      assignments: assignmentProgress,
      study: studyProgress,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calculating progress:', error);
    return null;
  }
};

export const calculateAchievements = (userId) => {
  try {
    const progress = calculateUserProgress(userId);
    const achievements = [];

    // Video achievements
    if (progress.videos.completed >= 1) achievements.push({ id: 'first_video', points: 50 });
    if (progress.videos.completed >= 5) achievements.push({ id: 'video_enthusiast', points: 100 });
    if (progress.videos.completed >= 10) achievements.push({ id: 'video_master', points: 200 });

    // Materials achievements
    if (progress.materials.total >= 1) achievements.push({ id: 'first_material', points: 50 });
    if (progress.materials.annotations >= 5) achievements.push({ id: 'annotator', points: 100 });
    if (progress.materials.total >= 10) achievements.push({ id: 'resource_collector', points: 200 });

    // Assignment achievements
    if (progress.assignments.completed >= 1) achievements.push({ id: 'first_assignment', points: 50 });
    if (progress.assignments.onTime >= 5) achievements.push({ id: 'punctual_student', points: 100 });
    if (progress.assignments.completed >= 10) achievements.push({ id: 'assignment_master', points: 200 });

    // Study time achievements
    if (progress.study.totalTime >= 3600) achievements.push({ id: 'study_hour', points: 50 });
    if (progress.study.totalSessions >= 5) achievements.push({ id: 'consistent_learner', points: 100 });
    if (progress.study.totalTime >= 18000) achievements.push({ id: 'study_champion', points: 300 });

    return achievements;
  } catch (error) {
    console.error('Error calculating achievements:', error);
    return [];
  }
};

export const calculateLevel = (userId) => {
  try {
    const achievements = calculateAchievements(userId);
    const totalPoints = achievements.reduce((acc, achievement) => acc + achievement.points, 0);
    
    // Level calculation: Each level requires more points than the previous
    const level = Math.floor(Math.sqrt(totalPoints / 100)) + 1;
    const pointsToNextLevel = Math.pow((level) * 10, 2) - totalPoints;

    return {
      currentLevel: level,
      totalPoints,
      pointsToNextLevel,
      achievements
    };
  } catch (error) {
    console.error('Error calculating level:', error);
    return {
      currentLevel: 1,
      totalPoints: 0,
      pointsToNextLevel: 100,
      achievements: []
    };
  }
};

export const updateUserProgress = (userId, activityType, data) => {
  try {
    // Get current progress
    let progress = JSON.parse(localStorage.getItem(`progress_${userId}`) || '{}');
    
    // Update based on activity type
    switch (activityType) {
      case 'video_watched':
        progress.videosWatched = (progress.videosWatched || 0) + 1;
        break;
      case 'material_added':
        progress.materialsAdded = (progress.materialsAdded || 0) + 1;
        break;
      case 'assignment_completed':
        progress.assignmentsCompleted = (progress.assignmentsCompleted || 0) + 1;
        break;
      case 'study_session':
        progress.studyTime = (progress.studyTime || 0) + data.duration;
        break;
    }

    // Save updated progress
    localStorage.setItem(`progress_${userId}`, JSON.stringify(progress));

    // Recalculate achievements and level
    const levelInfo = calculateLevel(userId);
    
    // Save level info
    localStorage.setItem(`level_${userId}`, JSON.stringify(levelInfo));

    return levelInfo;
  } catch (error) {
    console.error('Error updating progress:', error);
    return null;
  }
};

export const searchContent = async (userId, query) => {
  try {
    const searchResults = [];

    // Search in videos
    const videos = JSON.parse(localStorage.getItem(`videos_${userId}`) || '[]');
    const matchedVideos = videos.filter(video => 
      video.title.toLowerCase().includes(query.toLowerCase()) ||
      video.description?.toLowerCase().includes(query.toLowerCase())
    ).map(video => ({
      type: 'video',
      title: video.title,
      description: video.description,
      id: video.id
    }));
    searchResults.push(...matchedVideos);

    // Search in materials
    const materials = JSON.parse(localStorage.getItem(`materials_${userId}`) || '[]');
    const matchedMaterials = materials.filter(material => 
      material.title.toLowerCase().includes(query.toLowerCase()) ||
      material.description?.toLowerCase().includes(query.toLowerCase())
    ).map(material => ({
      type: 'material',
      title: material.title,
      description: material.description,
      id: material.id
    }));
    searchResults.push(...matchedMaterials);

    // Search in assignments
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]')
      .filter(a => a.studentId === userId);
    const matchedAssignments = assignments.filter(assignment => 
      assignment.title.toLowerCase().includes(query.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(query.toLowerCase())
    ).map(assignment => ({
      type: 'assignment',
      title: assignment.title,
      description: assignment.description,
      id: assignment.id
    }));
    searchResults.push(...matchedAssignments);

    return searchResults;
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
};
