import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export default function CustomerSocketHandler({ onUpdate }) {
    const { notifications } = useSocket();

    // Call onUpdate when new notifications arrive
    useEffect(() => {
        if (notifications.length > 0 && onUpdate) {
            const latestNotification = notifications[0];
            if (latestNotification.data) {
                onUpdate(latestNotification.data);
            }
        }
    }, [notifications, onUpdate]);

    return null;
}
