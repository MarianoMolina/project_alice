import React, { useEffect, useRef } from 'react';
import { GOOGLE_CLIENT_ID } from '../../../utils/Constants';

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
        };
      };
    };
  }
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({ onSuccess }) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      if (window.google && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: GoogleCredentialResponse) => {
            if (response.credential) {
              onSuccess(response.credential);
            }
          }
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: buttonRef.current.offsetWidth
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [onSuccess]);

  return <div ref={buttonRef} className="w-fit h-12 mt-4 mb-4 mx-auto" />;
};

export default GoogleOAuthButton;