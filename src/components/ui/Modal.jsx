import React from 'react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    if (!isOpen) return null;

    return (
        <div className="ui-modal-overlay" onClick={onClose}>
            <div className={`ui-modal ui-modal--${size}`} onClick={(e) => e.stopPropagation()}>
                <div className="ui-modal__header">
                    <h3 className="ui-modal__title">{title}</h3>
                    <button className="ui-modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="ui-modal__body">{children}</div>
                {footer && <div className="ui-modal__footer">{footer}</div>}
            </div>
        </div>
    );
};

export default Modal;
