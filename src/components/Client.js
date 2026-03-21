import React from 'react';
import Avatar from 'react-avatar';
import './Client.css';

/**
 * Renders a connected user avatar with username and online indicator.
 */
export default function Client({ username }) {
    return (
        <div className="client">
            <div className="client-avatar-wrap">
                <Avatar name={username} size={36} round="8px" />
                <span className="client-online-dot" />
            </div>
            <span className="client-username">{username}</span>
        </div>
    );
}
