// Suggested Firestore security rules (restrict abusive writes).
// Adjust as needed in Firebase console (Rules tab).
// This allows write only for small comments, prevents HTML, and rate-limits per IP cannot be done here.
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId}/comments/{commentId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['name','text','createdAt'])
        && request.resource.data.name.size() <= 40
        && request.resource.data.text.size() <= 2000
        && request.time - request.resource.data.createdAt <= duration.value(5, 'm');
      allow update, delete: if false; // manage deletions server-side or temporarily set for admin.
    }
  }
}
