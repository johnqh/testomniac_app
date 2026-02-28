import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStatus } from '@sudobility/auth-components';
import { getFirebaseAuth } from '@sudobility/auth_lib';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { LoginPage as LoginPageComponent } from '@sudobility/building_blocks';
import { CONSTANTS } from '../config/constants';

/**
 * Authentication page supporting email/password sign-in, sign-up,
 * and Google OAuth. Automatically redirects authenticated users
 * to the histories page.
 */
export default function LoginPage() {
  const { user, loading } = useAuthStatus();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const auth = getFirebaseAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate(`/${lang || 'en'}/histories`, { replace: true });
    }
  }, [user, loading, navigate, lang]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
        <div
          role="status"
          aria-label="Loading authentication"
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        />
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
        <p role="alert" className="text-red-600">
          Firebase not configured
        </p>
      </div>
    );
  }

  return (
    <LoginPageComponent
      appName={CONSTANTS.APP_NAME}
      logo={<img src="/logo.png" alt={CONSTANTS.APP_NAME} className="h-12" />}
      onEmailSignIn={async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      }}
      onEmailSignUp={async (email, password) => {
        await createUserWithEmailAndPassword(auth, email, password);
      }}
      onGoogleSignIn={async () => {
        await signInWithPopup(auth, new GoogleAuthProvider());
      }}
      onSuccess={() => navigate(`/${lang || 'en'}/histories`, { replace: true })}
    />
  );
}
