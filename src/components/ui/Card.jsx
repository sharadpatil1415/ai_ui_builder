import React from 'react';

const Card = ({ title, subtitle, children, footer, hoverable = false }) => {
    const className = `ui-card${hoverable ? ' ui-card--hoverable' : ''}`;
    return (
        <div className={className}>
            {(title || subtitle) && (
                <div className="ui-card__header">
                    {title && <h3 className="ui-card__title">{title}</h3>}
                    {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
                </div>
            )}
            <div className="ui-card__body">{children}</div>
            {footer && <div className="ui-card__footer">{footer}</div>}
        </div>
    );
};

export default Card;
