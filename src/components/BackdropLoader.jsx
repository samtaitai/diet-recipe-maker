import React from 'react';

const BackdropLoader = () => {
    return (
        <div className="backdrop-overlay">
            <div className="spinner" aria-label="Loading"></div>
        </div>
    );
};

export default BackdropLoader;
