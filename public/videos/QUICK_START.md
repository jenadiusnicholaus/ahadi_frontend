# Quick Start: Add Hero Video Background

## The video isn't showing because you need to add a video file!

### Easiest Solution (2 minutes):

1. **Go to Pexels Videos**: https://www.pexels.com/videos/
2. **Search for**: "celebration" or "community" or "people"
3. **Download** any video you like (choose HD quality)
4. **Rename** the downloaded file to: `hero-background.mp4`
5. **Move** it to: `public/videos/hero-background.mp4`
6. **Refresh** your browser - the video will now play!

### Alternative: Use YouTube

1. Find a YouTube video you like
2. Copy the video ID from the URL (e.g., from `youtube.com/watch?v=VIDEO_ID`)
3. Edit `src/config/app.ts`:
   - Change `HERO_VIDEO_TYPE` to `'youtube'`
   - Set `HERO_VIDEO_URL` to the video ID

### Why isn't it working?

- The code is ready and waiting for a video file
- Currently using: `/videos/hero-background.mp4` (doesn't exist yet)
- When video fails, it automatically shows the static image (that's why you see the image)

### Check Browser Console

Open browser DevTools (F12) → Console tab
- You should see: "Attempting to load hero video from: /videos/hero-background.mp4"
- If video fails: "Hero video failed to load, falling back to image"

Once you add the video file, it will work immediately!
