import dietRules from "../../diet-rules.json";

/**
 * Resolves the allowed and forbidden ingredients for a given week,
 * taking into account the inheritance ("all week X foods").
 * 
 * @param {number} week - The week number (1-4).
 * @returns {Object} { allowed: Set, forbidden: Set }
 */
export const resolveRules = (week) => {
    let allowed = new Set();
    let forbidden = new Set();

    // Iterate from Week 1 up to the current week to aggregate allowed foods
    for (let i = 1; i <= week; i++) {
        const weekData = dietRules.find(r => r.id === `week_${i}`);
        if (!weekData) continue;

        // Process allowed
        weekData.allowed_ingredients.forEach(ing => {
            const clean = ing.toLowerCase().trim();
            if (!clean.includes("all week")) {
                allowed.add(clean);
            }
        });

        // Process forbidden
        // Typically forbidden ingredients might stay the same or change.
        // For simplicity, we use the current week's forbidden list as the source of truth,
        // but since they are mostly static in this diet, we just update.
        weekData.forbidden_ingredients.forEach(ing => {
            forbidden.add(ing.toLowerCase().trim());
        });
    }

    return { allowed, forbidden };
};

/**
 * Validates a list of user ingredients against the resolved rules.
 * 
 * @param {string[]} userIngredients - List of ingredients provided by the user.
 * @param {number} week - The diet week.
 * @returns {Object} { prohibited: string[], unknown: string[] }
 */
export const validateIngredients = (userIngredients, week) => {
    const { allowed, forbidden } = resolveRules(week);
    const prohibited = [];
    const unknown = [];

    userIngredients.forEach(ing => {
        const cleanIng = ing.toLowerCase().trim();

        // 1. Check prohibited first (highest priority)
        // Fuzzy match: if user ingredient is in forbidden list OR vice versa
        let isProhibited = false;
        for (const f of forbidden) {
            if (cleanIng.includes(f) || f.includes(cleanIng)) {
                isProhibited = true;
                break;
            }
        }

        if (isProhibited) {
            prohibited.push(ing);
            return;
        }

        // 2. Check allowed
        // Fuzzy match: check if user ingredient matches any allowed item
        let isAllowed = false;
        for (const a of allowed) {
            if (cleanIng.includes(a) || a.includes(cleanIng)) {
                isAllowed = true;
                break;
            }
        }

        if (!isAllowed) {
            unknown.push(ing);
        }
    });

    return { prohibited, unknown };
};
