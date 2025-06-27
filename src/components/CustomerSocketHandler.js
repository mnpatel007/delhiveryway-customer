import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const socket = io('http://localhost:5000');

export default function CustomerSocketHandler({ onUpdate }) {
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user?.user?._id) return;
        socket.emit('registerCustomer', user.user._id);
        socket.on('orderStatusUpdated', data => onUpdate(data));
        return () => socket.off('orderStatusUpdated');
    }, [user, onUpdate]);

    return null;
}
