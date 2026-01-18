import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { auth } from "./services/firebase";
import { generateRecipeAPI } from "./services/api";
import DietForm from "./components/DietForm";
import RecipeDisplay from "./components/RecipeDisplay";
import AuthButton from "./components/AuthButton";
import PrintView from "./components/PrintView";
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGenerate = async (week, ingredients) => {
    if (!user) {
      alert("Please sign in first.");
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const result = await generateRecipeAPI(week, ingredients);
      setRecipe(result);
    } catch (err) {
      console.error(err);
      setError(t('error_msg'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${recipe?.title || 'recipe'}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ko' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{t('app_title')}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleLanguage}>{i18n.language === 'en' ? 'KO' : 'EN'}</button>
          <AuthButton user={user} />
        </div>
      </header>

      <main>
        <DietForm onSubmit={handleGenerate} isLoading={loading} />

        {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
        {recipe && <RecipeDisplay recipe={recipe} onDownloadPdf={handleDownloadPdf} />}
      </main>

      <PrintView ref={printRef} recipe={recipe} />
    </div>
  );
}

export default App;
