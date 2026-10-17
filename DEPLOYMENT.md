# Deployment Guide

## Pre-Deployment Checklist

Before deploying, ensure you have completed the following:

### 1. Install Dependencies
```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set Up Supabase Database
1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Run migrations in order:
   - `drizzle/migrations/0000_create_attendees.sql`
   - `drizzle/migrations/0001_improve_check_in.sql`

### 4. Build the Application
```bash
# Using Bun
bun run build

# Or using npm
npm run build
```

This creates a `dist/` folder with production-ready files.

### 5. Test Locally
```bash
# Preview production build
bun run preview
# or
npm run preview
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import in Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: Vite
     - Build Command: `bun run build` or `npm run build`
     - Output Directory: `dist`

3. **Add Environment Variables**
   In Vercel project settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get your production URL

### Option 2: Netlify

1. **Push to GitHub** (same as above)

2. **Import in Netlify**
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Configure:
     - Build command: `bun run build` or `npm run build`
     - Publish directory: `dist`

3. **Add Environment Variables**
   In Netlify site settings → Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. **Deploy**

### Option 3: Static Hosting (Vercel/Netlify/Cloudflare Pages)

If you prefer static hosting:

1. Build the application:
   ```bash
   bun run build
   ```

2. Upload the `dist/` folder to your static hosting provider.

3. Ensure environment variables are set in the hosting platform.

## Post-Deployment Steps

### 1. Verify Database Connection
- Open your deployed application
- Try to sign in/up
- If authentication fails, check Supabase URL and keys

### 2. Test Core Features
- Register an attendee
- Generate QR pass
- Scan QR with camera
- Verify manual code entry
- Check duplicate prevention
- Verify dashboard stats

### 3. Update README
Replace placeholders in README.md:
- Team member names
- Live deployment URL
- Demo video URL

### 4. Create Demo Video
Record a 3-5 minute demo showing:
- Registration process
- QR generation
- Camera scanning
- Manual verification
- Duplicate prevention
- Dashboard analytics

Upload to YouTube as unlisted, add URL to README.

## Troubleshooting

### Build Errors
- Ensure dependencies are installed: `bun install` or `npm install`
- Check Node.js version (18+ recommended)
- Clear cache: `rm -rf node_modules bun.lockb` then reinstall

### Environment Variables Not Working
- Ensure variables start with `VITE_` for client-side access
- Restart build after adding variables
- Check variable names match exactly

### Database Connection Issues
- Verify Supabase project is active
- Check API keys are correct
- Ensure RLS policies are applied
- Test in Supabase dashboard SQL Editor

### QR Scanner Not Working
- Camera requires HTTPS (or localhost)
- Check browser camera permissions
- Ensure `@yudiel/react-qr-scanner` is installed
- Test on mobile device for camera access

### Print Styles Not Applying
- Ensure print CSS is in `src/styles.css`
- Check `@media print` media query
- Test with browser print preview

## Security Checklist

- [ ] Never commit `.env` file with real keys
- [ ] Use environment variables for all secrets
- [ ] Supabase RLS policies are enabled
- [ ] Service role key only used server-side
- [ ] HTTPS enabled in production
- [ ] OAuth redirect URLs configured in Supabase

## Performance Optimization

The application is already optimized with:
- Code splitting via TanStack Start
- Lazy loading for QR scanner
- Optimized images and assets
- Efficient database queries
- Client-side caching with TanStack Query

For additional optimization:
- Enable CDN for static assets
- Configure Supabase edge functions if needed
- Add analytics (optional)

## Monitoring

Consider adding:
- Error tracking (Sentry, LogRocket)
- Analytics (Vercel Analytics, Plausible)
- Uptime monitoring
- Database usage monitoring via Supabase dashboard

## Support

For issues:
- Check Supabase logs in dashboard
- Review browser console for errors
- Check network tab for failed requests
- Verify environment variables are set
- Test locally first, then deploy

## Success Criteria

Deployment is successful when:
- ✅ Application loads without errors
- ✅ Authentication works (sign in/up)
- ✅ Attendee registration works
- ✅ QR generation displays correctly
- ✅ Camera scanning works (on mobile)
- ✅ Manual code entry works
- ✅ Duplicate prevention works
- ✅ Dashboard shows real data
- ✅ Print/download tickets work
- ✅ Responsive on mobile devices
