# File Upload Guide - Rishè E-Commerce

## 🎨 New Features Added

### 1. Landing Page Customization
Upload custom images or videos for your hero section background!

**Access**: Admin Panel → Landing Page Settings (`/admin/landing-page`)

**Features:**
- ✅ Upload hero section images (JPEG, PNG, WebP, GIF)
- ✅ Upload hero section videos (MP4, WebM, OGG)
- ✅ Customize hero title and subtitle
- ✅ Fade-out animation when scrolling
- ✅ Scroll indicator for better UX
- ✅ Real-time preview

**Supported Formats:**
- **Images**: JPEG, JPG, PNG, WebP, GIF (max 5MB)
- **Videos**: MP4, WebM, OGG (max 20MB)

### 2. Product Image Upload
No more image URLs! Upload images directly from your device.

**Access**: Admin Panel → Products → Add/Edit Product

**Features:**
- ✅ Upload multiple product images
- ✅ Drag & drop support
- ✅ Image preview before saving
- ✅ Delete uploaded images
- ✅ Automatic image optimization

**Limits:**
- Max 5MB per image
- Multiple images per product
- Formats: JPEG, PNG, WebP, GIF

## 📝 How to Use

### Customize Landing Page

1. **Sign in** to your admin account
2. Go to **Admin Panel** (`/admin`)
3. Click **"Landing Page"** card
4. Upload your hero media:
   - Click **"Upload Image or Video"**
   - Select file from your device
   - Preview will show automatically
5. Edit **Hero Title** and **Subtitle**
6. Click **"Save Changes"**
7. Visit homepage to see your changes!

**Recommended Hero Media:**
- **Images**: 1920x1080px or higher
- **Videos**: 1920x1080px, 10-30 seconds, compressed
- Use high-quality, professional imagery
- Ensure text is readable over the media

### Add Products with Image Upload

1. Go to **Admin Panel → Products**
2. Click **"Add Product"**
3. Fill in product details:
   - Name
   - Description
   - Price
4. **Upload Images**:
   - Click "Upload Product Images"
   - Select one or multiple images
   - View thumbnail previews
   - Remove any unwanted images
5. Add color variants and sizes
6. Mark as featured (optional)
7. Click **"Create Product"**

## 🎬 Animation Features

### Fade-Out Hero Section
When you scroll down from the hero section:
- Hero content fades out smoothly
- Creates a modern, dynamic effect
- Enhances user experience
- Draws attention to content below

### Scroll Indicator
- Animated mouse icon at bottom of hero
- Guides users to scroll
- Bounces up and down
- Disappears when scrolling

## 💾 File Storage

Files are stored as **base64-encoded** strings in MongoDB:
- No external storage required
- Instant upload & display
- Secure & reliable
- Easy backup

**Note**: For production with many images, consider using external storage (AWS S3, Cloudinary) to optimize database size.

## ⚙️ Technical Details

### File Upload Flow
1. User selects file
2. Client-side validation (type, size)
3. Convert to base64
4. Upload to backend
5. Store in MongoDB
6. Display on frontend

### File Size Limits
- **Images**: 5MB (optimized for web)
- **Videos**: 20MB (hero section only)
- Files larger than limits will be rejected

### Supported Browsers
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome)

## 🎯 Best Practices

### For Landing Page Media

**Images:**
- Use high-resolution (1920x1080+)
- Optimize before upload (TinyPNG, ImageOptim)
- Choose images with clear focal point
- Ensure brand consistency
- Test readability of text overlay

**Videos:**
- Keep under 15 seconds
- Mute by default (autoplay works)
- Compress for web (HandBrake, FFmpeg)
- Use MP4 format for best compatibility
- Test on mobile devices

### For Product Images

**Photography:**
- Use consistent lighting
- White or neutral background
- Show multiple angles
- Include detail shots
- Show product in use

**Technical:**
- Minimum 800x800px
- Square aspect ratio (1:1)
- JPEG format (smaller file size)
- Optimize before upload
- Name files descriptively

## 🔧 Troubleshooting

### Upload Fails
- **File too large**: Reduce file size
- **Wrong format**: Convert to supported format
- **Network error**: Check internet connection
- **Browser issue**: Try different browser

### Video Not Playing
- Use MP4 format
- Compress video file
- Check file size (<20MB)
- Test in different browser
- Ensure video is not corrupted

### Images Not Displaying
- Refresh the page
- Clear browser cache
- Check if upload succeeded
- Try different image format
- Verify file size <5MB

## 📱 Mobile Upload

Yes! You can upload files from mobile:
- Take photos directly with camera
- Select from gallery
- Same features as desktop
- Responsive interface
- Touch-friendly controls

## 🎨 Design Tips

### Hero Section
- Use eye-catching imagery
- Ensure high contrast for text
- Match your brand colors
- Show your best products
- Create emotional connection

### Product Images
- First image is most important
- Show product clearly
- Include lifestyle shots
- Show color variations
- Add close-up details

## 🚀 Next Steps

1. **Upload hero media** to make landing page stunning
2. **Add product images** from your device
3. **Test on mobile** to ensure responsive design
4. **Share your store** with customers!

---

**Need Help?**
Check the main documentation in `/app/QUICK_START.md`
