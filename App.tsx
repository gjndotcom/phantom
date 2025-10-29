import React, { useState, useEffect, useCallback } from 'react';

// --- TYPE DEFINITIONS ---
type PhantomEvent = "connect" | "disconnect" | "accountChanged";

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString: () => string } | null;
  connect: (options?: { onlyIfTrusted: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, callback: (args?: any) => void) => void;
  request: (method: string, params: any) => Promise<any>;
}

// --- HELPER COMPONENTS & FUNCTIONS ---

const PhantomIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 42 42" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M30.638 12.33C28.263 9.7125 24.815 8.1375 21.015 8.1375C17.215 8.1375 13.768 9.7125 11.393 12.33C10.7 13.0875 10.715 14.25 11.423 14.9812L12.578 16.125C12.915 16.45 13.388 16.6312 13.875 16.6312C14.363 16.6312 14.835 16.45 15.173 16.125C18.068 13.0688 22.828 12.4312 26.543 14.6125L24.443 16.7125C23.693 17.4625 23.693 18.675 24.443 19.425C24.818 19.8 25.318 20 25.818 20C26.318 20 26.818 19.8 27.193 19.425L30.563 16.05C31.288 15.3 31.3 14.1375 30.638 12.33Z" />
        <path d="M30.608 27.0188L29.453 25.875C29.115 25.55 28.643 25.3688 28.155 25.3688C27.668 25.3688 27.195 25.55 26.858 25.875C23.963 28.9313 19.203 29.5687 15.488 27.3875L17.588 25.2875C18.338 24.5375 18.338 23.325 17.588 22.575C17.213 22.2 16.713 22 16.213 22C15.713 22 15.213 22.2 14.838 22.575L11.468 25.95C10.743 26.7 10.725 27.8625 11.388 29.67C13.763 32.2875 17.21 33.8625 21.01 33.8625C24.81 33.8625 28.258 32.2875 30.633 29.67C31.323 28.9125 31.308 27.75 30.608 27.0188Z" />
    </svg>
);

const getProvider = (): PhantomProvider | undefined => {
  if ('solana' in window) {
    const provider = (window as any).solana;
    if (provider.isPhantom) {
      return provider as PhantomProvider;
    }
  }
  return undefined;
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [provider, setProvider] = useState<PhantomProvider | undefined>(undefined);
  const [walletKey, setWalletKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    const provider = getProvider();
    if (provider) {
      setProvider(provider);

      // Try to eagerly connect if the wallet is already connected
      provider.connect({ onlyIfTrusted: true })
        .then(resp => setWalletKey(resp.publicKey.toString()))
        .catch(err => console.error("Auto-connect failed:", err));

      // Listen for account changes
      provider.on('accountChanged', (publicKey) => {
        if (publicKey) {
          setWalletKey(publicKey.toString());
        } else {
          // This case occurs if the user disconnects from the wallet extension
          setWalletKey(undefined);
        }
      });

      // Listen for explicit disconnect
      provider.on('disconnect', () => {
        setWalletKey(undefined);
      });
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (provider) {
      try {
        const { publicKey } = await provider.connect();
        setWalletKey(publicKey.toString());
      } catch (err) {
        console.error("User rejected the request:", err);
      }
    }
  }, [provider]);

  const disconnectWallet = useCallback(async () => {
    if (provider) {
      try {
        await provider.disconnect();
        setWalletKey(undefined);
      } catch (err) {
        console.error("Disconnection failed:", err);
      }
    }
  }, [provider]);

  const renderContent = () => {
    if (!provider) {
      return (
        <div className="text-center">
          <p className="mb-4 text-lg text-gray-400">Phantom wallet not detected.</p>
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center space-x-3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            <PhantomIcon className="w-6 h-6" />
            <span>Get Phantom Wallet</span>
          </a>
        </div>
      );
    }

    if (walletKey) {
      return (
        <div className="flex flex-col items-center space-y-4 w-full">
          
          <div className="bg-gray-900 px-4 py-2 rounded-lg text-lg text-purple-400 font-mono break-all w-full text-center">
            {`${walletKey.substring(0, 4)}...${walletKey.substring(walletKey.length - 4)}`}
          </div>
          <button
            onClick={disconnectWallet}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            Disconnect
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={connectWallet}
        className="bg-purple-400 hover:bg-purple-450 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center space-x-1 shadow-lg text-xl">
        <PhantomIcon className="w-7 h-7" />
        <span>Connect Phantom Wallet</span>
      </button>
    );
  };

  return (
    // This component is self-contained. The host page can control its positioning.
    // The `p-4` and `font-sans` provide some basic styling.
    <div className="font-sans p-4">
      <div>
       
       
        <div className="w-full flex justify-center">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;
