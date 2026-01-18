import { auth } from "./firebase";

export const generateRecipeAPI = async (week, ingredients) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();

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
