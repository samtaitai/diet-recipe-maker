import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { searchIngredientsAPI, addIngredientAPI, addToIngredientListAPI } from "../services/api";

const CATEGORIES = ["protein", "vegetable", "fruit", "grain", "dairy", "spice", "other"];

function IngredientSearch({ onAdd }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNameKo, setNewNameKo] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [addStatus, setAddStatus] = useState(null);
  const [listAddStatus, setListAddStatus] = useState({});
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchIngredientsAPI(query.trim());
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);


  const handleAddIngredient = async (e) => {
    e.preventDefault();
    setAddStatus(null);

    const name = newName.trim();
    if (!name) return;

    try {
      await addIngredientAPI(name, newNameKo.trim(), newCategory);
      setAddStatus("success");
      setNewName("");
      setNewNameKo("");
      setNewCategory("other");
      setShowAddForm(false);
      setQuery(name);
    } catch (err) {
      if (err.message.includes("409") || err.message.includes("already exists")) {
        setAddStatus("exists");
      } else {
        setAddStatus("error");
        console.error("Add failed:", err);
      }
    }
  };

  const handleAddToList = async (item) => {
    setListAddStatus((prev) => ({ ...prev, [item.id]: null }));
    try {
      await addToIngredientListAPI(item.id, item.name, item.name_ko || "", item.category, "");
      setListAddStatus((prev) => ({ ...prev, [item.id]: "success" }));
      if (onAdd) onAdd();
    } catch (err) {
      if (err.status === 409 || err.message.includes("409") || err.message.includes("already")) {
        setListAddStatus((prev) => ({ ...prev, [item.id]: "duplicate" }));
      } else {
        setListAddStatus((prev) => ({ ...prev, [item.id]: "error" }));
        console.error("Add to list failed:", err);
      }
    }
  };

  return (
    <section style={{ marginBottom: "2rem", padding: "1.5rem", background: "#ffffff", border: "1px solid #e7e5e4", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)" }}>
      <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
        {t("ingredient_search_label")}
      </label>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("ingredient_search_placeholder")}
        style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box", background: "#ffffff", border: "1px solid #e7e5e4", borderRadius: "12px", color: "#44403c", fontFamily: "inherit", fontSize: "1rem" }}
      />

      {loading && <p style={{ color: "#78716c", marginTop: "0.5rem" }}>...</p>}

      {!loading && query.trim() && results.length === 0 && (
        <p style={{ color: "#78716c", marginTop: "0.5rem" }}>{t("no_results")}</p>
      )}

      {results.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0", maxHeight: "250px", overflowY: "auto", border: "1px solid #e7e5e4", borderRadius: "12px" }}>
          {results.map((item) => (
            <li key={item.id} style={{ padding: "0.6rem 0.8rem", borderBottom: "1px solid #e7e5e4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <span>
                <strong>{item.name}</strong>
                {item.name_ko && <span style={{ color: "#78716c", marginLeft: "0.5rem" }}>({item.name_ko})</span>}
                <span style={{ fontSize: "0.8em", color: "#78716c", marginLeft: "0.5rem" }}>[{item.category}]</span>
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                <button
                  onClick={() => handleAddToList(item)}
                  style={{ fontSize: "0.8em", padding: "0.3em 0.8em" }}
                >
                  {t("add_to_list")}
                </button>
                {listAddStatus[item.id] === "success" && <span style={{ color: "#10b981", fontSize: "0.8em" }}>✓</span>}
                {listAddStatus[item.id] === "duplicate" && <span style={{ color: "#d97706", fontSize: "0.75em" }}>{t("ingredient_already_in_list")}</span>}
                {listAddStatus[item.id] === "error" && <span style={{ color: "#ef4444", fontSize: "0.75em" }}>{t("error_msg")}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && !showAddForm && (
        <button
          onClick={() => {
            setShowAddForm(true);
            setNewName(query.trim());
          }}
          style={{ marginTop: "0.75rem", padding: "0.5em 1.2em", fontSize: "0.9em" }}
        >
          {t("add_new_ingredient")}
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleAddIngredient} style={{ marginTop: "1rem", padding: "1rem", background: "#fafaf9", borderRadius: "12px", border: "1px solid #e7e5e4" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>{t("ingredient_name")}: </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              style={{ padding: "0.3rem", background: "#ffffff", border: "1px solid #e7e5e4", borderRadius: "8px", color: "#44403c" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>{t("ingredient_name_ko")}: </label>
            <input
              type="text"
              value={newNameKo}
              onChange={(e) => setNewNameKo(e.target.value)}
              style={{ padding: "0.3rem", background: "#ffffff", border: "1px solid #e7e5e4", borderRadius: "8px", color: "#44403c" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>{t("ingredient_category")}: </label>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ padding: "0.3rem" }}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="primary" style={{ padding: "0.4rem 1rem", cursor: "pointer" }}>
            {t("add_new_ingredient")}
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            style={{ marginLeft: "0.5rem", padding: "0.4rem 1rem", cursor: "pointer" }}
          >
            Cancel
          </button>
        </form>
      )}

      {addStatus === "success" && <p style={{ color: "#10b981", marginTop: "0.5rem" }}>{t("ingredient_added")}</p>}
      {addStatus === "exists" && <p style={{ color: "#d97706", marginTop: "0.5rem" }}>{t("ingredient_exists")}</p>}
      {addStatus === "error" && <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>{t("error_msg")}</p>}
    </section>
  );
}

export default IngredientSearch;
