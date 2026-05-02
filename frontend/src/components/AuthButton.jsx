import { useState, useEffect } from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { LogIn, LogOut } from 'lucide-react';

export default function AuthButton() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error", error);
    }
  };

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
          alt="Avatar" 
          className="w-8 h-8 rounded-full border border-slate-600"
        />
        <button 
          onClick={handleSignOut}
          className="p-2 rounded-xl border border-slate-700 bg-surface hover:bg-slate-700 text-textSecondary hover:text-white transition-colors"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleSignIn}
      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
    >
      <LogIn size={18} />
      Sign in with Google
    </button>
  );
}
