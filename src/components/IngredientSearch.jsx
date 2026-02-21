import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const WELLNESS_HINTS = [
  "Pair protein with fiber-rich veggies for sustained energy.",
  "Add leafy greens to boost your daily iron intake.",
  "Healthy fats like avocado support brain function.",
  "Include colorful veggies to maximize antioxidant variety.",
  "Lean proteins help build and repair muscle tissue.",
  "Spices like turmeric and ginger have anti-inflammatory benefits."
];

function IngredientSearch({ ingredients = [], onAdd, onRemove, onClear, onOpenInspiration }) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  // Rotating hint logic
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % WELLNESS_HINTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredients(inputValue);
    } else if (e.key === "Backspace" && !inputValue && ingredients.length > 0) {
      onRemove(ingredients[ingredients.length - 1]);
    }
  };

  const addIngredients = (value) => {
    if (!value.trim()) return;
    const newIngredients = value.split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    newIngredients.forEach(ing => onAdd(ing));
    setInputValue("");
  };

  return (
    <div className="animate-fade-up" style={{ maxWidth: "42rem", margin: "0 auto 2rem auto", textAlign: "center" }}>
      {/* Header */}
      <h1 style={{
        fontSize: "clamp(2rem, 5vw, 3rem)",
        fontWeight: 700,
        color: "var(--foreground)",
        marginBottom: "0.5rem",
        lineHeight: 1.15
      }}>
        {t("ingredient_input_title") || "What's in your fridge?"}
      </h1>

      {/* Subheader */}
      <p style={{
        fontSize: "clamp(0.9rem, 3vw, 1.125rem)",
        color: "var(--muted-fg)",
        marginBottom: "1.5rem",
        marginTop: "0"
      }}>
        {t("ingredient_input_subtitle") || "Name whatever you have...then leave it to us."}
      </p>

      {/* Help / Wellness Bubble */}
      <div style={{
        marginBottom: "1rem",
        minHeight: "2.5rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <span
          key={currentHintIndex}
          className="wellness-bubble"
        >
          ✨ {t(`hint_${currentHintIndex}`) || WELLNESS_HINTS[currentHintIndex]}
        </span>
      </div>

      {/* Main Input Container */}
      <div style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-soft)",
            cursor: "text",
            minHeight: "60px",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "hsl(152 28% 40%)";
            e.currentTarget.style.boxShadow = "0 0 0 3px hsl(152 28% 40% / 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.boxShadow = "var(--shadow-soft)";
          }}
        >
          {/* Render ingredient badges */}
          {ingredients.map((ing, index) => (
            <span key={index} className="ingredient-badge">
              {ing}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(ing);
                }}
                aria-label={`Remove ${ing}`}
              >
                ×
              </button>
            </span>
          ))}

          {/* The actual input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ingredients.length === 0 ? (t("ingredient_placeholder") || "Add ingredients (e.g. chicken, rice)...") : (t("add_more") || "Add more...")}
            autoFocus={ingredients.length === 0}
            style={{
              flex: "1",
              minWidth: "80px",
              border: "none",
              outline: "none",
              fontSize: "1rem",
              background: "transparent",
              color: "var(--text-main)",
              padding: "4px 0",
              fontFamily: "inherit"
            }}
          />

          {/* Clear All Button (inside right) */}
          {ingredients.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              style={{
                padding: "4px 10px",
                background: "transparent",
                border: "none",
                color: "hsl(0 84% 60%)",
                fontSize: "0.85rem",
                cursor: "pointer",
                marginLeft: "auto",
                fontWeight: 500,
                whiteSpace: "nowrap"
              }}
            >
              {t("clear_all") || "Clear all"}
            </button>
          )}
        </div>
      </div>

      {/* Inspiration Button */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <button
          onClick={onOpenInspiration}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted-fg)",
            fontSize: "0.9rem",
            cursor: "pointer",
            textDecoration: "underline",
            opacity: 0.8,
            transition: "opacity 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
          onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}
        >
          💡 {t("need_inspiration")}
        </button>
      </div>
    </div>
  );
}

export default IngredientSearch;
