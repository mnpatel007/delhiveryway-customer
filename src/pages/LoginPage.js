import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            if (res.data.user.role !== 'customer') {
                alert('Not a customer account');
                return;
            }
            login(res.data);
            navigate('/');
        } catch (err) {
            alert('Login failed');
        }
    };

    return (
        <div>
            <h2>Customer Login</h2>
            <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
};

export default LoginPage;
