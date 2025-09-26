import { Button } from '@/components/ui/button';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNotification } from '@/hooks/useNotification';

interface NotificationSettingsProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
}

export default function NotificationSettings({ open, onOpenChange }: NotificationSettingsProps) {
    const { permission, requestPermission, playNotificationSound, showNotification } = useNotification();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        // Load settings from localStorage
        const savedNotificationSetting = localStorage.getItem('ai-notifications-enabled');
        const savedSoundSetting = localStorage.getItem('ai-sound-enabled');

        setNotificationsEnabled(savedNotificationSetting === 'true');
        setSoundEnabled(savedSoundSetting !== 'false'); // Default to true
    }, []);

    const handleNotificationToggle = async (enabled: boolean) => {
        if (enabled && permission !== 'granted') {
            const result = await requestPermission();
            if (result !== 'granted') {
                return; // Don't enable if permission denied
            }
        }

        setNotificationsEnabled(enabled);
        localStorage.setItem('ai-notifications-enabled', enabled.toString());
    };

    const handleSoundToggle = (enabled: boolean) => {
        setSoundEnabled(enabled);
        localStorage.setItem('ai-sound-enabled', enabled.toString());

        // Play test sound when enabling
        if (enabled) {
            playNotificationSound();
        }
    };

    const testNotification = async () => {
        // Test sound first if enabled
        if (soundEnabled) {
            playNotificationSound();
        }

        // Test notification if enabled
        if (notificationsEnabled) {
            if (permission !== 'granted') {
                const result = await requestPermission();
                if (result !== 'granted') {
                    alert('Permission untuk notifikasi ditolak. Silakan aktifkan di pengaturan browser.');
                    return;
                }
            }

            try {
                await showNotification({
                    title: 'ProjectAI - Test',
                    body: 'Ini adalah test notifikasi AI response',
                    icon: '/asset/img/Icon.png',
                    playSound: soundEnabled,
                });
            } catch (error) {
                alert('Error saat membuat notifikasi: ' + (error as Error).message);
            }
        }

        // Show feedback if neither sound nor notification is enabled
        if (!soundEnabled && !notificationsEnabled) {
            alert('Aktifkan notifikasi atau suara terlebih dahulu untuk melakukan test.');
        }
    };

    const handleRequestPermission = async () => {
        const result = await requestPermission();

        if (result === 'granted') {
            // Auto-enable notifications if permission is granted
            setNotificationsEnabled(true);
            localStorage.setItem('ai-notifications-enabled', 'true');
        }
    };

    const getPermissionStatus = () => {
        switch (permission) {
            case 'granted':
                return { text: 'Diizinkan', color: 'text-green-600' };
            case 'denied':
                return { text: 'Ditolak', color: 'text-red-600' };
            default:
                return { text: 'Belum ditentukan', color: 'text-yellow-600' };
        }
    };

    const permissionStatus = getPermissionStatus();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Pengaturan Notifikasi
                    </DialogTitle>
                    <DialogDescription>Atur notifikasi dan suara ketika AI selesai memberikan response</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    {/* Browser Permission Status */}
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                        <div>
                            <p className="text-sm font-medium">Status Izin Browser</p>
                            <p className={`text-xs ${permissionStatus.color}`}>{permissionStatus.text}</p>
                        </div>
                        {permission !== 'granted' && (
                            <Button size="sm" variant="outline" onClick={handleRequestPermission}>
                                Minta Izin
                            </Button>
                        )}
                    </div>

                    {/* Notification Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="notifications" className="flex items-center gap-2">
                                {notificationsEnabled ? <Bell className="h-4 w-4 text-blue-600" /> : <BellOff className="h-4 w-4 text-gray-400" />}
                                Notifikasi Browser
                            </Label>
                            <p className="text-xs text-muted-foreground">Tampilkan notifikasi ketika AI selesai memberikan response</p>
                        </div>
                        <Switch
                            id="notifications"
                            checked={notificationsEnabled}
                            onCheckedChange={handleNotificationToggle}
                            disabled={permission === 'denied'}
                        />
                    </div>

                    {/* Sound Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="sound" className="flex items-center gap-2">
                                {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-gray-400" />}
                                Suara Notifikasi
                            </Label>
                            <p className="text-xs text-muted-foreground">Putar suara ketika AI selesai memberikan response</p>
                        </div>
                        <Switch id="sound" checked={soundEnabled} onCheckedChange={handleSoundToggle} />
                    </div>

                    {/* Test Button */}
                    <div className="border-t pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={testNotification}
                            className="w-full"
                            disabled={!notificationsEnabled && !soundEnabled}
                        >
                            Test Notifikasi & Suara
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
