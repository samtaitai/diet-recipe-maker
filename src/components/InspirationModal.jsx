import { useTranslation } from "react-i18next";
import { resolveRules } from "../utils/dietValidator";
import dietRules from "../../diet-rules.json";

const CATEGORY_MAP = {
    // Proteins
    "eggs": "proteins", "chicken": "proteins", "fish": "proteins", "sashimi": "proteins",
    "boiled pork (suyuk)": "proteins", "tofu": "proteins", "soft tofu": "proteins", "seafood": "proteins",
    "legumes": "proteins",
    // Vegetables
    "cabbage": "vegetables", "carrots": "vegetables", "radish": "vegetables",
    "mushrooms": "vegetables", "broccoli": "vegetables", "cucumber": "vegetables",
    "seaweed": "vegetables", "tomatoes": "vegetables", "leafy greens": "vegetables",
    // Grains
    "multi-grain rice": "grains", "brown rice": "grains", "sweet potatoes": "grains",
    "sweet pumpkin": "grains",
    // Healthy Fats
    "avocado": "fats", "perilla oil": "fats", "coconut oil": "fats", "olive oil": "fats",
    "plain yogurt": "fats", "nuts": "fats", "cheese": "fats",
    // Flavour Boosters
    "soy sauce": "boosters", "turmeric": "boosters", "wasabi": "boosters",
    "red chili powder": "boosters", "green tea": "boosters", "garlic": "boosters",
    "vinegar": "boosters", "black pepper": "boosters", "onions": "boosters",
    "herb tea": "boosters", "black coffee": "boosters", "milk": "boosters",
    "bananas": "boosters", "berries": "boosters", "fruits": "boosters"
};

function InspirationModal({ week, onAdd, onClose, currentIngredients = [] }) {
    const { t } = useTranslation();
    const { allowed, forbidden } = resolveRules(week);
    const weekData = dietRules.find(r => r.id === `week_${week}`);

    const categorized = {
        proteins: [],
        vegetables: [],
        grains: [],
        fats: [],
        boosters: []
    };

    Array.from(allowed).forEach(ing => {
        const category = CATEGORY_MAP[ing] || "boosters";
        categorized[category].push(ing);
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content inspiration-modal animate-fade-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="serif-title">{t("inspiration_title")}</h2>
                        <p className="subtitle">{t("inspiration_subtitle", { week })}</p>
                    </div>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-body custom-scrollbar">
                    {/* Section: Rules */}
                    <section className="inspiration-section">
                        <h3 className="section-title">✨ {t("rules_title")}</h3>
                        <div className="rules-box">
                            <p>{weekData?.rules_text}</p>
                        </div>
                    </section>

                    {/* Section: Allowed Ingredients */}
                    <section className="inspiration-section">
                        <div className="section-header-row">
                            <h3 className="section-title">✅ {t("allowed_title")}</h3>
                        </div>

                        <div className="categories-grid">
                            {Object.entries(categorized).map(([cat, items]) => (
                                items.length > 0 && (
                                    <div key={cat} className="category-group">
                                        <h4 className="category-title">{t(`category_${cat}`)}</h4>
                                        <div className="ingredient-chips">
                                            {items.map(ing => {
                                                const isAdded = currentIngredients.some(ci => ci.toLowerCase() === ing.toLowerCase());
                                                return (
                                                    <button
                                                        key={ing}
                                                        className={`ingredient-chip ${isAdded ? 'added' : ''}`}
                                                        onClick={() => !isAdded && onAdd(ing)}
                                                        disabled={isAdded}
                                                    >
                                                        {ing} {isAdded ? '✓' : '+'}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </section>

                    {/* Section: Prohibited */}
                    <section className="inspiration-section">
                        <div className="section-header-row">
                            <h3 className="section-title">🚫 {t("prohibited_ingredients")}</h3>
                            <span className="hint-text text-danger">{t("prohibited_hint")}</span>
                        </div>
                        <div className="prohibited-list">
                            {Array.from(forbidden).map(ing => (
                                <span key={ing} className="prohibited-tag">{ing}</span>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="modal-footer">
                    <button className="btn-primary" onClick={onClose}>{t("save")}</button>
                </div>
            </div>
        </div>
    );
}

export default InspirationModal;
