import React, { useEffect, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '../../../utils/Constants';
import { Google } from '@mui/icons-material';

interface GoogleOAuthButtonProps {
  onSuccess: (credential: string) => void;
}

// Type for Google's credential response
interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
  client_id: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string | undefined;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type: 'standard' | 'icon';
              theme: 'outline' | 'filled_blue' | 'filled_black';
              size: 'large' | 'medium' | 'small';
              width?: number;
            }
          ) => void;
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              isDismissedMoment: () => boolean;
              getNotDisplayedReason: () => string;
              getSkippedReason: () => string;
              getDismissedReason: () => string;
            }) => void
          ) => void;
          cancel: () => void; 
        };
      };
    };
  }
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: GoogleCredentialResponse) => {
            setIsLoading(false);
            if (response.credential) {
              onSuccess(response.credential);
            }
          }
        });
      }
    };

    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      if (window.google) {
        window.google.accounts.id.cancel();
      }
    };
  }, [onSuccess]);

  const handleClick = () => {
    setIsLoading(true);
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="relative group/btn flex space-x-2 items-center justify-center px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)] transition-colors"
      type="button"
    >
      <Google className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
      <span className="text-neutral-700 dark:text-neutral-300 text-sm">
        {isLoading ? 'Loading...' : 'Continue with Google'}
      </span>
      <BottomGradient />
    </button>
  );
};

export default GoogleOAuthButton;