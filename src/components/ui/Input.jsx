import React from 'react';

const Input = ({ label, placeholder, type = 'text', value, onChange, error, helperText, disabled = false }) => {
    const inputClass = `ui-input${error ? ' ui-input--error' : ''}`;
    return (
        <div className="ui-input-group">
            {label && <label className="ui-input-label">{label}</label>}
            <input
                className={inputClass}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
            {error && <span className="ui-input-error-text">{error}</span>}
            {helperText && !error && <span className="ui-input-helper">{helperText}</span>}
        </div>
    );
};

export default Input;
