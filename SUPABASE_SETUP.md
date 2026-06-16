# Supabase Storage Setup Guide

## ✅ Checklist: Create and Configure Storage Bucket

### Step 1: Create the "content-files" Bucket
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Storage** in the left sidebar
4. Click **Create Bucket**
5. Name it: `content-files`
6. **Uncheck** "Make it private" (set to Public so files can be accessed)
7. Click **Create bucket**

### Step 2: Configure RLS Policies (Row Level Security)

1. Go to **Storage** → **content-files** bucket
2. Click the **⋮ (three dots)** menu → **Edit Policies**
3. Click **New policy** → **For full customization**

**For SELECT (View/Download files):**
- Name: `Allow public read`
- Policy:
  ```
  true
  ```
- Click **Create policy**

**For INSERT (Upload files):**
- Name: `Allow authenticated users to upload`
- Policy:
  ```
  auth.role() = 'authenticated'
  ```
- Click **Create policy**

**For UPDATE (Update files):**
- Name: `Allow authenticated users to update`
- Policy:
  ```
  auth.role() = 'authenticated'
  ```
- Click **Create policy**

**For DELETE (Delete files):**
- Name: `Allow authenticated users to delete`
- Policy:
  ```
  auth.role() = 'authenticated'
  ```
- Click **Create policy**

### Step 3: Verify Setup

After creating the bucket and policies:

1. Open browser **Developer Console** (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Try uploading a file in the app
4. Check the console for logs:
   - ✅ "Uploading file: [filename]" — File upload started
   - ✅ "Upload successful: [data]" — File uploaded to Supabase
   - ❌ "Upload error: [message]" — Something went wrong

### Step 4: View Uploaded Files in Supabase

1. Go to **Supabase Dashboard** → **Storage** → **content-files**
2. You should see files listed with timestamps (e.g., `1718620000000-myfile.txt`)
3. If no files appear, check the console error from Step 3

## 🔧 Troubleshooting

**Problem: "Upload failed" toast appears**
- Check the browser console (F12) for detailed error
- Verify the bucket name is exactly `content-files`
- Check RLS policies are configured correctly
- Make sure you're logged in (authenticated user)

**Problem: Files don't appear in Supabase**
- Check if bucket exists: **Storage** → should see `content-files`
- Check RLS policies: **Storage** → **content-files** → **⋮ (menu)** → **Policies**
- Verify INSERT policy allows authenticated users

**Problem: "Content files bucket not found" error**
- Create the bucket first (Step 1)
- Check bucket name spelling (case-sensitive)

## 📝 After Setup

Once the bucket is created and policies are configured:
1. The app will automatically upload files when you select them
2. Files will be stored with a timestamp prefix (e.g., `1718620000000-filename.txt`)
3. Files will be visible in your Supabase Storage dashboard
4. The File Viewer (📄 button) will display the content

---

**Questions?** Check the browser console (F12) for detailed error messages when uploading files.
