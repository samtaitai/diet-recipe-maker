import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const getAuthToken = async (optional = false) => {
  const user = auth.currentUser;
  if (!user) {
    if (optional) return null;
    throw new Error("User not authenticated");
  }
  return user.getIdToken();
};

export const generateRecipeAPI = async (week, ingredients) => {
  const token = await getAuthToken(true);

  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/generateRecipe", {
    method: "POST",
    headers,
    body: JSON.stringify({ week, ingredients })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to generate recipe");
  }

  return response.json();
};

export const getUserIngredients = async (uid) => {
  if (!uid) return [];

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return data.ingredient_list || [];
  }
  return [];
};

export const saveUserIngredients = async (uid, ingredients) => {
  if (!uid) throw new Error("User UID is required to save ingredients");

  const userRef = doc(db, "users", uid);
  // Merge: true to update only the ingredient_list field
  await setDoc(userRef, { ingredient_list: ingredients }, { merge: true });
};


// --- Favorites API (US-6) ---

export const saveFavoriteAPI = async (recipe, week) => {
  const token = await getAuthToken();

  const response = await fetch("/api/save_favorite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      recipe_title: recipe.title,
      recipe_content: recipe,
      week,
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save favorite");
  }

  return response.json();
};

export const getFavoritesAPI = async () => {
  const token = await getAuthToken();

  const response = await fetch("/api/get_favorites", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch favorites");
  }

  return response.json();
};

export const deleteFavoriteAPI = async (favoriteId) => {
  const token = await getAuthToken();

  const response = await fetch("/api/delete_favorite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ favorite_id: favoriteId })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to delete favorite");
  }

  return response.json();
};
