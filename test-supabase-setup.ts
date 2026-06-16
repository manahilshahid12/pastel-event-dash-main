/**
 * Supabase Setup Test
 *
 * Run this to verify your Supabase configuration:
 * 1. Copy this file to your src/ directory
 * 2. Import and call it from your browser console or a test component
 * 3. Check the console output for results
 */

import { createClient } from "@supabase/supabase-js";

export async function testSupabaseSetup() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log("🔍 Testing Supabase Setup...\n");

  // 1. Check environment variables
  console.log("1️⃣ Environment Variables:");
  console.log("   VITE_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
  console.log("   VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Set" : "❌ Missing");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("\n❌ Missing environment variables. Check your .env.local file.");
    return;
  }

  // 2. Test Supabase connection
  console.log("\n2️⃣ Supabase Connection:");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn("   ⚠️  Not logged in. Sign in to test file uploads.");
    } else {
      console.log("   ✅ Authenticated as:", user.email);
    }
  } catch (e) {
    console.error("   ❌ Connection failed:", e);
  }

  // 3. Test bucket access
  console.log("\n3️⃣ Storage Bucket 'content-files':");
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("   ❌ Cannot list buckets:", bucketsError.message);
      return;
    }

    const contentFilesBucket = buckets?.find((b) => b.name === "content-files");

    if (!contentFilesBucket) {
      console.error("   ❌ Bucket 'content-files' not found!");
      console.log("   📋 Available buckets:", buckets?.map((b) => b.name) || "none");
      console.log("\n   👉 ACTION: Create the 'content-files' bucket in Supabase Dashboard:");
      console.log("      Storage → Create Bucket → Name: 'content-files' → Create");
      return;
    }

    console.log("   ✅ Bucket 'content-files' exists");
    console.log("   📦 Public:", contentFilesBucket.public);

    if (!contentFilesBucket.public) {
      console.warn("   ⚠️  Bucket is private. Consider making it public for easier access.");
    }
  } catch (e) {
    console.error("   ❌ Error checking bucket:", e);
  }

  // 4. Test file listing
  console.log("\n4️⃣ Listing Files in Bucket:");
  try {
    const { data: files, error: listError } = await supabase.storage
      .from("content-files")
      .list();

    if (listError) {
      console.error("   ❌ Cannot list files:", listError.message);
      console.log("   💡 Check RLS Policies on the bucket");
      return;
    }

    console.log("   ✅ Can list files");
    console.log("   📄 Files in bucket:", files?.length || 0);

    if (files && files.length > 0) {
      console.log("   📋 Sample files:");
      files.slice(0, 3).forEach((f) => {
        console.log(`      - ${f.name} (${f.metadata?.size} bytes)`);
      });
    } else {
      console.log("   💡 No files uploaded yet. Try uploading one!");
    }
  } catch (e) {
    console.error("   ❌ Error listing files:", e);
  }

  // 5. Test file upload (if authenticated)
  console.log("\n5️⃣ Testing File Upload:");
  try {
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("   ⚠️  Not authenticated. Cannot test upload.");
      console.log("   👉 Sign in first, then run this test again.");
      return;
    }

    // Create a test file
    const testContent = "Test file created at " + new Date().toISOString();
    const testFile = new File([testContent], "test-upload.txt", { type: "text/plain" });

    const fileName = `test-${Date.now()}.txt`;
    const { data, error: uploadError } = await supabase.storage
      .from("content-files")
      .upload(fileName, testFile, { upsert: true });

    if (uploadError) {
      console.error("   ❌ Upload failed:", uploadError.message);
      console.log("   💡 Common issues:");
      console.log("      - RLS policies not configured");
      console.log("      - Bucket doesn't allow authenticated uploads");
      return;
    }

    console.log("   ✅ Upload successful!");
    console.log("   📝 File path:", data?.path);

    // Clean up - delete test file
    await supabase.storage.from("content-files").remove([fileName]);
    console.log("   🧹 Test file cleaned up");
  } catch (e) {
    console.error("   ❌ Upload test error:", e);
  }

  console.log("\n✅ Setup test complete!");
}

// Usage in browser console:
// 1. Copy this entire file
// 2. Paste in browser DevTools console
// 3. Run: testSupabaseSetup()
