import { useTranslation } from "react-i18next";

const categoryColors = {
  protein: { bg: "#fef2f2", text: "#dc2626" },
  vegetable: { bg: "#f0fdf4", text: "#16a34a" },
  fruit: { bg: "#fefce8", text: "#ca8a04" },
  grain: { bg: "#faf5ff", text: "#9333ea" },
  dairy: { bg: "#eff6ff", text: "#2563eb" },
  spice: { bg: "#fff7ed", text: "#ea580c" },
  other: { bg: "#f5f5f4", text: "#78716c" },
};

function MyIngredientList({ ingredients, onRemove, loading }) {
  const { t } = useTranslation();

  return (
    <section style={{
      marginBottom: "2rem",
      padding: "1.5rem",
      background: "#ffffff",
      border: "1px solid #e7e5e4",
      borderRadius: "24px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
    }}>
      <h3 style={{ margin: "0 0 1rem 0", color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.9rem" }}>
        {t("my_ingredients")}
      </h3>

      {loading && <p style={{ color: "#78716c" }}>...</p>}

      {!loading && ingredients.length === 0 && (
        <p style={{ color: "#78716c", fontStyle: "italic" }}>
          {t("ingredient_list_empty")}
        </p>
      )}

      {!loading && ingredients.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {ingredients.map((item) => {
            const colors = categoryColors[item.category] || categoryColors.other;
            return (
              <li key={item.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.6rem 0.8rem",
                background: "#fafaf9",
                borderRadius: "12px",
                border: "1px solid #e7e5e4",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <strong style={{ color: "#44403c" }}>{item.name}</strong>
                  {item.name_ko && (
                    <span style={{ color: "#78716c", fontSize: "0.9em" }}>({item.name_ko})</span>
                  )}
                  <span style={{
                    fontSize: "0.75em",
                    padding: "0.15em 0.5em",
                    borderRadius: "12px",
                    background: colors.bg,
                    color: colors.text,
                    fontWeight: 500,
                  }}>
                    {item.category}
                  </span>
                  {item.quantity && (
                    <span style={{ color: "#78716c", fontSize: "0.85em" }}>
                      {item.quantity}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  style={{ fontSize: "0.8em", padding: "0.3em 0.8em" }}
                >
                  {t("remove_from_list")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default MyIngredientList;
