import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import { generateRecipePDF } from "./utils/pdfGenerator";
import {
  generateRecipeAPI,
  getUserIngredients,
  saveUserIngredients,
  getFavoritesAPI,
  saveFavoriteAPI,
  deleteFavoriteAPI
} from "./services/api";
import DietForm from "./components/DietForm";
import RecipeDisplay from "./components/RecipeDisplay";
import PrintView from "./components/PrintView";
import IngredientSearch from "./components/IngredientSearch";
import FavoritesList from "./components/FavoritesList";
import ValidationModal from "./components/ValidationModal";
import InspirationModal from "./components/InspirationModal";
import AppHeader from "./components/AppHeader";
import { validateIngredients } from "./utils/dietValidator";
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

  // Modal & Selection State
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResults, setValidationResults] = useState({ prohibited: [], unknown: [] });
  const [pendingWeek, setPendingWeek] = useState(null);

  const printRef = useRef();

  const fetchIngredientList = async (uid) => {
    if (!uid) return;
    setIngredientListLoading(true);
    try {
      const list = await getUserIngredients(uid);
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
        fetchIngredientList(currentUser.uid);
        fetchFavorites();
      } else {
        setIngredientList([]);
        setFavorites([]);
        setRecipe(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGenerate = async (week, isChefMode = false) => {
    if (!isChefMode && !user) {
      alert("Please sign in first.");
      return;
    }

    if (!isChefMode && ingredientList.length === 0) {
      alert(t('ingredient_list_empty') || "Please add ingredients first.");
      return;
    }

    if (isChefMode) {
      await proceedWithGeneration(week, true);
      return;
    }

    // Step 1: Validate Ingredients
    const results = validateIngredients(ingredientList, week);
    if (results.prohibited.length > 0 || results.unknown.length > 0) {
      setValidationResults(results);
      setPendingWeek(week);
      setShowValidationModal(true);
      return;
    }

    // Step 2: Proceed if valid
    await proceedWithGeneration(week, false);
  };

  const proceedWithGeneration = async (week, isChefMode = false) => {
    setShowValidationModal(false);
    setCurrentWeek(week);
    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const ingredientsString = isChefMode ? "" : ingredientList.join(", ");
      const result = await generateRecipeAPI(week, ingredientsString);
      setRecipe(Array.isArray(result) ? result[0] : result);
    } catch (err) {
      console.error(err);
      setError(err.message || t('error_msg'));
    } finally {
      setLoading(false);
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
    // Scroll to recipe
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddIngredient = async (newIngredient) => {
    if (!newIngredient) return;
    if (ingredientList.includes(newIngredient)) return;

    const newList = [...ingredientList, newIngredient];
    setIngredientList(newList);
    try {
      if (user) await saveUserIngredients(user.uid, newList);
    } catch (err) {
      console.error("Failed to save ingredients:", err);
    }
  };

  const handleRemoveFromList = async (ingredientToRemove) => {
    const newList = ingredientList.filter((item) => item !== ingredientToRemove);
    setIngredientList(newList);
    try {
      if (user) await saveUserIngredients(user.uid, newList);
    } catch (err) {
      console.error("Failed to remove ingredient:", err);
    }
  };

  const handleClearAll = async () => {
    setIngredientList([]);
    try {
      if (user) await saveUserIngredients(user.uid, []);
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

  const isFavorited = recipe && favorites.some(f => f.recipe_title === recipe.title);

  return (
    <>
      <AppHeader user={user} />
      <div className="container" style={{ padding: '0 2rem 2rem 2rem' }}>
        <main>
          {user && (
            <IngredientSearch
              ingredients={ingredientList}
              onAdd={handleAddIngredient}
              onRemove={handleRemoveFromList}
              onClear={handleClearAll}
              onOpenInspiration={() => setShowInspirationModal(true)}
            />
          )}
          <DietForm
            week={currentWeek}
            onWeekChange={setCurrentWeek}
            onSubmit={handleGenerate}
            isLoading={loading}
            hasIngredients={ingredientList.length > 0}
            isLoggedIn={!!user}
          />

          {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
          {recipe && (
            <RecipeDisplay
              recipe={recipe}
              onDownloadPdf={handleDownloadPdf}
              onSaveFavorite={handleSaveFavorite}
              isFavorited={isFavorited}
              isSaving={isSavingFavorite}
              isLoggedIn={!!user}
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

          {showValidationModal && (
            <ValidationModal
              results={validationResults}
              onProceed={() => proceedWithGeneration(pendingWeek, false)}
              onCancel={() => setShowValidationModal(false)}
            />
          )}

          {showInspirationModal && (
            <InspirationModal
              week={currentWeek}
              onAdd={handleAddIngredient}
              onClose={() => setShowInspirationModal(false)}
              currentIngredients={ingredientList}
            />
          )}
        </main>

        {/* Hidden Print View for PDF Generation */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <PrintView ref={printRef} recipe={recipe} activeLanguage={i18n.language} />
        </div>

        <footer className="app-footer">
          <div className="footer-content">
            <p>{t('copyright', { year: new Date().getFullYear() })}</p>
            <div className="footer-links">
              <a href="#" className="footer-link" target="_blank" rel="noopener noreferrer" title="View on GitHub">
                <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
