import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import { generateRecipePDF } from "./utils/pdfGenerator";
import {
  generateRecipeAPI,
  getUserIngredients,
  saveUserIngredients,
  getShoppingListAPI,
  getFavoritesAPI,
  saveFavoriteAPI,
  deleteFavoriteAPI
} from "./services/api";
import DietForm from "./components/DietForm";
import RecipeDisplay from "./components/RecipeDisplay";
import AuthButton from "./components/AuthButton";
import PrintView from "./components/PrintView";
import IngredientSearch from "./components/IngredientSearch";
import FavoritesList from "./components/FavoritesList";
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [recipe, setRecipe] = useState(null);
  // US-6: Favorites State
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ingredientList, setIngredientList] = useState([]);
  const [ingredientListLoading, setIngredientListLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState(null);
  const [shoppingListLoading, setShoppingListLoading] = useState(false);
  const printRef = useRef();

  const fetchIngredientList = async () => {
    setIngredientListLoading(true);
    try {
      const list = await getUserIngredients();
      setIngredientList(list);
    } catch (err) {
      console.error("Failed to fetch ingredient list:", err);
    } finally {
      setIngredientListLoading(false);
    }
  };

  // US-6: Fetch Favorites
  const fetchFavorites = async () => {
    if (!auth.currentUser) return;
    setFavoritesLoading(true);
    try {
      const result = await getFavoritesAPI();
      setFavorites(result.favorites || []);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    } finally {
      setFavoritesLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchIngredientList();
        fetchFavorites();
      } else {
        setIngredientList([]);
        setFavorites([]);
        setRecipe(null);
        setShoppingList(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGenerate = async (week) => {
    if (!user) {
      alert("Please sign in first.");
      return;
    }

    if (ingredientList.length === 0) {
      alert(t('ingredient_list_empty') || "Please add ingredients first.");
      return;
    }

    setCurrentWeek(week);
    setLoading(true);
    setError(null);
    setRecipe(null);
    setShoppingList(null);

    try {
      const ingredientsString = ingredientList.join(", ");
      const result = await generateRecipeAPI(week, ingredientsString);
      setRecipe(result);
    } catch (err) {
      console.error(err);
      setError(t('error_msg'));
    } finally {
      setLoading(false);
    }
  };

  const handleGetShoppingList = async () => {
    if (!recipe) return;
    setShoppingListLoading(true);
    try {
      const result = await getShoppingListAPI(recipe.ingredients);
      setShoppingList(result);
    } catch (err) {
      console.error("Failed to fetch shopping list:", err);
    } finally {
      setShoppingListLoading(false);
    }
  };

  // US-6: Favorite Handlers
  const handleSaveFavorite = async () => {
    if (!recipe || !user) return;
    setIsSavingFavorite(true);
    try {
      await saveFavoriteAPI(recipe, currentWeek);
      await fetchFavorites(); // Refresh list
    } catch (err) {
      console.error("Failed to save favorite:", err);
      alert(err.message || "Failed to save favorite");
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const handleDeleteFavorite = async (id) => {
    if (!window.confirm("Are you sure you want to remove this favorite?")) return;
    try {
      await deleteFavoriteAPI(id);
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error("Failed to delete favorite:", err);
    }
  };

  const handleSelectFavorite = (fav) => {
    setRecipe(fav.recipe_content);
    setCurrentWeek(fav.week || 1);
    setShoppingList(null); // Clear shopping list when loading a favorite
    // Scroll to recipe
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddIngredient = async (newIngredient) => {
    if (!newIngredient) return;
    if (ingredientList.includes(newIngredient)) return;

    const newList = [...ingredientList, newIngredient];
    setIngredientList(newList);
    try {
      await saveUserIngredients(newList);
    } catch (err) {
      console.error("Failed to save ingredients:", err);
    }
  };

  const handleRemoveFromList = async (ingredientToRemove) => {
    const newList = ingredientList.filter((item) => item !== ingredientToRemove);
    setIngredientList(newList);
    try {
      await saveUserIngredients(newList);
    } catch (err) {
      console.error("Failed to remove ingredient:", err);
    }
  };

  const handleClearAll = async () => {
    setIngredientList([]);
    try {
      await saveUserIngredients([]);
    } catch (err) {
      console.error("Failed to clear ingredients:", err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!recipe) return;

    try {
      await generateRecipePDF('recipe-print-view', `${recipe.title || 'recipe'}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert(t('pdf_error') || "Failed to generate PDF. Please try again.");
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ko' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const isFavorited = recipe && favorites.some(f => f.recipe_title === recipe.title);

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e7e5e4', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{t('app_title')}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleLanguage}>{i18n.language === 'en' ? 'KO' : 'EN'}</button>
          <AuthButton user={user} />
        </div>
      </header>

      <main>
        {user && (
          <IngredientSearch
            ingredients={ingredientList}
            onAdd={handleAddIngredient}
            onRemove={handleRemoveFromList}
            onClear={handleClearAll}
          />
        )}
        <DietForm onSubmit={handleGenerate} isLoading={loading} />

        {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
        {recipe && (
          <RecipeDisplay
            recipe={recipe}
            onDownloadPdf={handleDownloadPdf}
            onGetShoppingList={handleGetShoppingList}
            shoppingList={shoppingList}
            isShoppingListLoading={shoppingListLoading}
            onSaveFavorite={handleSaveFavorite}
            isFavorited={isFavorited}
            isSaving={isSavingFavorite}
          />
        )}

        {user && (
          <FavoritesList
            favorites={favorites}
            onSelect={handleSelectFavorite}
            onDelete={handleDeleteFavorite}
            isLoading={favoritesLoading}
          />
        )}
      </main>

      {/* Hidden Print View for PDF Generation */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <PrintView ref={printRef} recipe={recipe} activeLanguage={i18n.language} />
      </div>

      <footer>
        Made with 💚 for your well-being
      </footer>
    </div>
  );
}

export default App;
