import React from 'react';

const Button = ({ variant = 'primary', size = 'md', disabled = false, onClick, children }) => {
    const className = `ui-btn ui-btn--${variant} ui-btn--${size}`;
    return (
        <button className={className} disabled={disabled} onClick={onClick}>
            {children}
        </button>
    );
};

export default Button;
