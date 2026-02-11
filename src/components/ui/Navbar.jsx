import React from 'react';

const Navbar = ({ brand, items = [], actions }) => {
    return (
        <nav className="ui-navbar">
            <div className="ui-navbar__brand">{brand}</div>
            <ul className="ui-navbar__links">
                {items.map((item, index) => (
                    <li key={index}>
                        <a
                            className={`ui-navbar__link${item.active ? ' ui-navbar__link--active' : ''}`}
                            href={item.href || '#'}
                            onClick={item.onClick}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
            {actions && <div className="ui-navbar__actions">{actions}</div>}
        </nav>
    );
};

export default Navbar;
