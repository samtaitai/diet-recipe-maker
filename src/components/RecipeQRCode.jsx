import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const RecipeQRCode = ({ recipeId }) => {
    // Construct the URL back to the recipe. 
    // For now, we'll use the current window location or a base URL.
    const recipeUrl = `${window.location.origin}/recipe/${recipeId || ''}`;

    return (
        <div className="qr-code-container flex flex-col items-center gap-2 mt-8">
            <QRCodeSVG
                value={recipeUrl}
                size={80}
                level="M"
                includeMargin={true}
            />
            <span className="text-[10px] text-gray-500 font-sans tracking-wide uppercase">
                Scan to view digital recipe
            </span>
        </div>
    );
};

export default RecipeQRCode;
