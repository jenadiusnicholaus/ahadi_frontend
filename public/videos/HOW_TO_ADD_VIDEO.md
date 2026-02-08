# How to Add Hero Background Video

## Quick Steps:

1. **Download a free video:**
   - Visit https://www.pexels.com/videos/ or https://mixkit.co/free-stock-video/
   - Search for "celebration", "community", "people", or "party"
   - Download a video (choose HD or 4K quality)

2. **Save the video:**
   - Rename it to `hero-background.mp4`
   - Place it in: `public/videos/hero-background.mp4`

3. **That's it!** The video will automatically load as your hero background.

## Alternative: Use a Video URL

If you have a video hosted elsewhere (Cloudinary, Vimeo, your own server), update `src/config/app.ts`:

```typescript
export const HERO_VIDEO_URL = 'https://your-video-url.com/video.mp4'
```

## Video Requirements:

- Format: MP4 (H.264 codec recommended)
- Resolution: 1920x1080 (Full HD) or higher
- Duration: 10-30 seconds (will loop)
- File size: Keep under 10MB for fast loading

## Troubleshooting:

- If video doesn't show: Check browser console for errors
- Video too large? Compress it using HandBrake or similar tools
- Fallback: If video fails, the static image will show automatically
