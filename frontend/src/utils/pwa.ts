// PWA 유틸리티 함수들

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;

  constructor() {
    this.checkIfInstalled();
    this.setupInstallPrompt();
    this.registerServiceWorker();
  }

  // Service Worker 등록
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker 등록 성공:', registration.scope);

        // 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 새 버전 사용 가능
                this.notifyUpdate();
              }
            });
          }
        });
      } catch (error) {
        console.error('ServiceWorker 등록 실패:', error);
      }
    }
  }

  // 설치 프롬프트 설정
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      console.log('먹스타그램이 설치되었습니다!');
    });
  }

  // 설치 여부 확인
  private checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }

    // iOS 확인
    if ((navigator as any).standalone) {
      this.isInstalled = true;
    }
  }

  // 설치 버튼 표시
  private showInstallButton() {
    const event = new CustomEvent('pwa-install-available');
    window.dispatchEvent(event);
  }

  // 앱 설치 프롬프트 표시
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('사용자가 설치를 수락했습니다');
      this.deferredPrompt = null;
      return true;
    } else {
      console.log('사용자가 설치를 거부했습니다');
      return false;
    }
  }

  // 업데이트 알림
  private notifyUpdate() {
    const event = new CustomEvent('pwa-update-available');
    window.dispatchEvent(event);
  }

  // 업데이트 적용
  async applyUpdate() {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // 푸시 알림 권한 요청
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // 푸시 알림 구독
  async subscribeToPush(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready;
    
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });
      
      return subscription;
    } catch (error) {
      console.error('푸시 구독 실패:', error);
      return null;
    }
  }

  // Base64 URL을 Uint8Array로 변환
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Getter
  get canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  get installed(): boolean {
    return this.isInstalled;
  }
}

// 싱글톤 인스턴스
export const pwaManager = new PWAManager();