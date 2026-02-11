import React from 'react';

const Sidebar = ({ items = [], title, collapsed = false }) => {
    const sidebarClass = `ui-sidebar ${collapsed ? 'ui-sidebar--collapsed' : 'ui-sidebar--expanded'}`;
    return (
        <aside className={sidebarClass}>
            {title && !collapsed && <div className="ui-sidebar__title">{title}</div>}
            <nav className="ui-sidebar__nav">
                {items.map((item, index) => (
                    <button
                        key={index}
                        className={`ui-sidebar__item${item.active ? ' ui-sidebar__item--active' : ''}`}
                        onClick={item.onClick}
                    >
                        {item.icon && <span className="ui-sidebar__item-icon">{item.icon}</span>}
                        {!collapsed && <span>{item.label}</span>}
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
