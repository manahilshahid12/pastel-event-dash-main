# ⚡ Quick Setup Checklist

## 🎯 What to Do Right Now

Follow these steps in order. Takes about 10 minutes.

---

## Step 1️⃣: Go to Supabase

```
1. Open: https://supabase.com/dashboard
2. Sign in
3. Click your project
```

---

## Step 2️⃣: Create Database Tables

```
1. Click "SQL Editor" (left sidebar)
2. Click "New Query"
3. Copy ALL code from: DATABASE_SETUP.md (in your project folder)
4. Paste it in the SQL editor
5. Click "RUN" button
6. Wait for ✓ checkmarks
```

---

## Step 3️⃣: Enable Security Policies

```
1. Click "SQL Editor" again
2. Click "New Query"
3. Copy ALL code from: RLS_POLICIES.sql (in your project folder)
4. Paste it in
5. Click "RUN" button
```

**Done! ✅**

---

## Step 4️⃣: Refresh Your App

```
1. Go to: http://localhost:3000
2. Press Cmd+R (Mac) or Ctrl+R (Windows)
3. Click "🗓️ Events"
4. Click "New event"
5. Create an event
6. Click on it
```

---

## Step 5️⃣: Check All Tabs Appear

When you click your event, you should see:

- [ ] Requirements tab
- [ ] Essentials tab  
- [ ] Guests tab
- [ ] Agenda tab
- [ ] Media tab
- [ ] Speakers tab
- [ ] Analytics tab
- [ ] Notes tab

If you see all 8 tabs → **SUCCESS! 🎉**

---

## 🆘 If Something's Wrong

### "Tables don't exist" error?
→ Run the SQL from Step 2 again

### "Permission denied" error?
→ Run the SQL from Step 3 again

### Tabs still empty?
→ Refresh browser (Cmd+R / Ctrl+R)
→ Create a NEW event after running SQL
→ Click on that new event

### Still not working?
→ Check `.env` file has correct Supabase URL
→ Make sure you're signed into the app

---

## ✨ Features Now Active

Once setup is complete:

✅ Create events with full details
✅ Track event requirements
✅ Manage essentials list
✅ Add and track guests
✅ Create event agenda
✅ Add event speakers
✅ Upload event media
✅ View event analytics
✅ Collaborate with notes

---

## 📝 Files in Your Project

These help you set up:
- `COMPLETE_SETUP_GUIDE.md` - Full detailed guide
- `DATABASE_SETUP.md` - How to create tables
- `RLS_POLICIES.sql` - Security policies SQL
- `this file` - Quick checklist

---

**You've got this! 🌸**
