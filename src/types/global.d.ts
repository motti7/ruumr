export {};

declare global {
  interface ImportMetaEnv {
    readonly VITE_BASE44_APP_ID?: string;
    readonly VITE_BASE44_BACKEND_URL?: string;
    readonly VITE_BASE44_APP_BASE_URL?: string;
    readonly VITE_ONESIGNAL_APP_ID?: string;
    readonly VITE_RUUMR_SIMULATOR_MODE?: string;
    readonly [key: string]: string | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    __ruumrAudio?: HTMLAudioElement | null;
    __ruumrOneSignalInitQueued?: boolean;
    __ruumrOneSignalInitialized?: boolean;
    __ruumrSimulatorBackendEnabled?: boolean;
    __ruumrSimulatorState?: any;
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    plugins?: {
      OneSignal?: any;
      [key: string]: any;
    };
    AndroidBridge?: {
      back?: () => void;
      close?: () => void;
      [key: string]: any;
    };
    webkit?: {
      messageHandlers?: {
        backButton?: {
          postMessage?: (value?: any) => void;
        };
        [key: string]: any;
      };
      [key: string]: any;
    };
  }

  var module: {
    exports: any;
  };
}
