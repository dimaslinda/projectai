import { useEffect, useRef, useState } from 'react';

interface NotificationOptions {
    title?: string;
    body?: string;
    icon?: string;
    playSound?: boolean;
    soundUrl?: string;
}

export function useNotification() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Check current permission status
        if ('Notification' in window) {
            const currentPermission = Notification.permission;
            setPermission(currentPermission);
            
            // Listen for permission changes (some browsers support this)
            const checkPermissionChange = () => {
                if (Notification.permission !== permission) {
                    setPermission(Notification.permission);
                }
            };
            
            // Check permission periodically (fallback for browsers that don't support permission change events)
            const permissionCheckInterval = setInterval(checkPermissionChange, 1000);
            
            // Cleanup interval
            return () => {
                clearInterval(permissionCheckInterval);
            };
        }

        // Create audio element for notification sound
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const requestPermission = async (): Promise<NotificationPermission> => {
        if (!('Notification' in window)) {
            alert('Browser Anda tidak mendukung notifikasi.');
            return 'denied';
        }

        if (permission === 'granted') {
            return 'granted';
        }

        if (permission === 'denied') {
            alert('Izin notifikasi telah ditolak sebelumnya. Silakan aktifkan melalui pengaturan browser:\n\n1. Klik ikon gembok/info di address bar\n2. Pilih "Notifications" atau "Notifikasi"\n3. Ubah ke "Allow" atau "Izinkan"');
            return 'denied';
        }

        try {
            // Check if the browser supports the promise-based API
            let result: NotificationPermission;
            
            if (typeof Notification.requestPermission === 'function') {
                // Modern browsers
                result = await Notification.requestPermission();
            } else {
                // Fallback for older browsers
                result = await new Promise((resolve) => {
                    Notification.requestPermission(resolve);
                });
            }
            
            setPermission(result);
            
            // Provide user feedback
            switch (result) {
                case 'granted':
                    break;
                case 'denied':
                    alert('Izin notifikasi ditolak. Notifikasi browser tidak akan berfungsi.');
                    break;
                case 'default':
                    alert('Dialog izin ditutup. Silakan coba lagi untuk mengaktifkan notifikasi.');
                    break;
            }
            
            return result;
        } catch (error) {
            alert('Terjadi error saat meminta izin notifikasi: ' + (error as Error).message);
            return 'denied';
        }
    };

    const playNotificationSound = (soundUrl?: string) => {
        try {
            // If custom sound URL is provided, use traditional audio element
            if (soundUrl) {
                if (!audioRef.current) return;
                audioRef.current.src = soundUrl;
                audioRef.current.volume = 0.5;
                audioRef.current.play().catch(() => {
                    // Silent fail for sound
                });
                return;
            }

            // Use Web Audio API to generate a simple notification beep
            const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioContext = new AudioContextClass();
            
            // Create oscillator for the beep sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Configure the beep sound
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz frequency
            oscillator.type = 'sine';
            
            // Configure volume envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            // Play the sound
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
            // Clean up
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
                audioContext.close();
            };
            
        } catch {
            // Fallback: try to use system notification sound
            try {
                if ('Notification' in window && Notification.permission === 'granted') {
                    // Create a silent notification that will use system sound
                    const notification = new Notification('', {
                        silent: false,
                        tag: 'sound-only'
                    });
                    setTimeout(() => notification.close(), 100);
                }
            } catch {
                // Silent fail
            }
        }
    };

    const showNotification = async (options: NotificationOptions = {}) => {
        const {
            title = 'ProjectAI',
            body = 'AI telah selesai memberikan response',
            icon = '/favicon.svg',
            playSound = true,
            soundUrl
        } = options;

        // Check if browser supports notifications
        if (!('Notification' in window)) {
            if (playSound) {
                playNotificationSound(soundUrl);
            }
            return;
        }

        // Request permission if not granted
        const currentPermission = await requestPermission();
        
        if (currentPermission !== 'granted') {
            // Still play sound even if notification is not allowed
            if (playSound) {
                playNotificationSound(soundUrl);
            }
            return;
        }

        try {
            // Show browser notification
            const notification = new Notification(title, {
                body,
                icon,
                badge: icon,
                tag: 'ai-response', // Prevent duplicate notifications
                requireInteraction: false,
                silent: !playSound // Let browser handle sound if playSound is true
            });

            // Auto close notification after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            // Play custom sound if specified (but not default browser sound)
            if (playSound && soundUrl) {
                playNotificationSound(soundUrl);
            } else if (playSound) {
                // Play our custom beep sound instead of relying on browser
                playNotificationSound();
            }

            // Handle notification events
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

        } catch {
            // Fallback to sound only
            if (playSound) {
                playNotificationSound(soundUrl);
            }
        }
    };

    const showAIResponseNotification = () => {
        // Check user preferences from localStorage
        const notificationsEnabled = localStorage.getItem('ai-notifications-enabled') === 'true';
        const soundEnabled = localStorage.getItem('ai-sound-enabled') !== 'false'; // Default to true
        
        // Only show notification if user has enabled it
        if (notificationsEnabled || soundEnabled) {
            showNotification({
                title: 'ProjectAI - Response Ready',
                body: 'AI telah selesai memberikan response Anda',
                icon: '/favicon.svg',
                playSound: soundEnabled
            });
        }
    };

    return {
        permission,
        requestPermission,
        showNotification,
        showAIResponseNotification,
        playNotificationSound
    };
}