# How to Change Hero Background Video

The hero video is now **dynamic** and can be changed easily via environment variables!

## Quick Steps:

1. **Open `.env` file** in the project root
2. **Find these lines:**
   ```
   VITE_HERO_VIDEO_TYPE=youtube
   VITE_HERO_VIDEO_URL=Uz4H-whMHfs
   ```
3. **Change the values:**
   - `VITE_HERO_VIDEO_TYPE`: Set to `youtube` or `mp4`
   - `VITE_HERO_VIDEO_URL`: Set to your video ID or URL
4. **Restart your dev server** (if running)
5. **Refresh browser** - new video will load!

## Examples:

### YouTube Video:
```env
VITE_HERO_VIDEO_TYPE=youtube
VITE_HERO_VIDEO_URL=YOUR_YOUTUBE_VIDEO_ID
```
- Get video ID from: `youtube.com/watch?v=VIDEO_ID`
- Example: `youtube.com/watch?v=Uz4H-whMHfs` → Use `Uz4H-whMHfs`

### Self-Hosted MP4:
```env
VITE_HERO_VIDEO_TYPE=mp4
VITE_HERO_VIDEO_URL=/videos/your-video.mp4
```
- Place video in: `public/videos/your-video.mp4`

### Direct MP4 URL:
```env
VITE_HERO_VIDEO_TYPE=mp4
VITE_HERO_VIDEO_URL=https://example.com/video.mp4
```

## Current Default:
- **Type**: YouTube
- **Video**: WorldRemit "How Does WorldRemit Work?" (shows world map with money transfers)

## No Code Changes Needed!
Just edit `.env` and restart - that's it! 🎉
