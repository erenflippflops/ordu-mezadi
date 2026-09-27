# Ordu Mezadı - GitHub & Vercel Deployment

## Step 1: Push to GitHub

### Option A: Create New Repo via GitHub Website (Easiest)

1. Go to: https://github.com/new
2. Repository name: `ordu-mezadi`
3. Description: `Multiplayer army auction game`
4. Public or Private: **Public**
5. **DON'T** initialize with README (we already have code)
6. Click **"Create repository"**

7. Copy the commands shown (should look like this):
```bash
git remote add origin https://github.com/YOUR_USERNAME/ordu-mezadi.git
git branch -M main
git push -u origin main
```

8. Run those commands in your terminal (in the ordu-mezadi folder)

### Option B: Use Git CLI (if you have git configured with GitHub)

```bash
# From ordu-mezadi directory
git remote add origin https://github.com/YOUR_USERNAME/ordu-mezadi.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

1. Go back to Vercel: https://vercel.com/new
2. Click **"Import Git Repository"** 
3. Find `ordu-mezadi` in the list
4. Click **"Import"**
5. **Project Settings**:
   - Framework Preset: **Other**
   - Root Directory: `./` (leave as is)
   - Build Command: (leave empty)
   - Output Directory: `public`
6. Click **"Deploy"**

Wait ~30 seconds... Done! 🎉

---

## Step 3: Test Your Game

Visit your Vercel URL (e.g., `https://ordu-mezadi.vercel.app`)

**Test checklist:**
- [ ] Home page loads
- [ ] Click "Oda Oluştur"
- [ ] Select mode & enter name
- [ ] Room code appears
- [ ] Open in another tab/browser
- [ ] Join with room code
- [ ] Start game
- [ ] Place bids
- [ ] Complete auction
- [ ] Watch battle
- [ ] See final results

---

## Troubleshooting

### "Permission denied" when pushing to GitHub
- Make sure you're logged into GitHub
- Use HTTPS URL with personal access token
- Or set up SSH keys

### Vercel deployment fails
- Check that `public/` directory exists
- Check Firebase config is correct
- View deployment logs in Vercel dashboard

### Game doesn't load
- Open browser console (F12)
- Check for Firebase errors
- Verify Firebase config in `public/js/firebase-config.js`

### Room doesn't update
- Check Firebase Realtime Database rules are published
- Check Anonymous Auth is enabled

---

## Your Firebase Config (Already Set Up ✅)

- Database URL: `https://ordu-mezadi-default-rtdb.europe-west1.firebasedatabase.app`
- Project ID: `ordu-mezadi`
- Anonymous Auth: Enabled ✅
- Security Rules: Published ✅

---

## Need Help?

Check the full guide: `DEPLOYMENT.md`

Or open an issue on GitHub!

---

**Ready to play!** ⚔️
