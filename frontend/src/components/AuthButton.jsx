import { useState, useEffect } from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { LogIn, LogOut } from 'lucide-react';

/**
 * AuthButton Component.
 * Handles user authentication via Google Sign-In using Firebase.
 * Displays user avatar and name when authenticated.
 *
 * @returns {JSX.Element} The rendered AuthButton component.
 */
export default function AuthButton() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Triggers the Firebase Google Sign-In popup.
   */
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error", error);
    }
  };

  /**
   * Signs the current user out of Firebase.
   */
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-textSecondary hidden sm:block">
          {user.displayName}
        </div>
        <img 
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
          alt={`Avatar for ${user.displayName}`} 
          className="w-8 h-8 rounded-full border border-slate-600"
        />
        <button 
          onClick={handleSignOut}
          className="p-2 rounded-xl border border-slate-700 bg-surface hover:bg-slate-700 text-textSecondary hover:text-white transition-colors"
          title="Sign out"
          aria-label="Sign out of Nexus AI"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleSignIn}
      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
      aria-label="Sign in with Google"
    >
      <LogIn size={18} aria-hidden="true" />
      Sign in with Google
    </button>
  );
}
