import { auth } from "./firebase";

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.getIdToken();
};

export const generateRecipeAPI = async (week, ingredients) => {
  const token = await getAuthToken();

  const response = await fetch("/api/generateRecipe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ week, ingredients })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to generate recipe");
  }

  return response.json();
};

export const searchIngredientsAPI = async (query) => {
  const token = await getAuthToken();

  const response = await fetch(`/api/ingredients/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to search ingredients");
  }

  return response.json();
};

export const addIngredientAPI = async (name, nameKo, category) => {
  const token = await getAuthToken();

  const response = await fetch("/api/ingredients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name, name_ko: nameKo, category })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to add ingredient");
  }

  return response.json();
};

export const getIngredientListAPI = async () => {
  const token = await getAuthToken();

  const response = await fetch("/api/ingredient-list", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch ingredient list");
  }

  return response.json();
};

export const addToIngredientListAPI = async (ingredientId, name, nameKo, category, quantity) => {
  const token = await getAuthToken();

  const response = await fetch("/api/ingredient-list/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ ingredient_id: ingredientId, name, name_ko: nameKo, category, quantity })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(errorText || "Failed to add to ingredient list");
    err.status = response.status;
    throw err;
  }

  return response.json();
};

export const removeFromIngredientListAPI = async (id) => {
  const token = await getAuthToken();

  const response = await fetch("/api/ingredient-list/remove", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ id })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to remove from ingredient list");
  }

  return response.json();
};

export const updateIngredientAPI = async (id, name, nameKo, category) => {
  const token = await getAuthToken();

  const response = await fetch("/api/ingredients/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ id, name, name_ko: nameKo, category })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to update ingredient");
  }

  return response.json();
};
