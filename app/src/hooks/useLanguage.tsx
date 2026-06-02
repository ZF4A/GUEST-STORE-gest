import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Lang = "EN" | "FR";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  "Dashboard": { EN: "Dashboard", FR: "Tableau de Bord" },
  "Products": { EN: "Products", FR: "Produits" },
  "Categories": { EN: "Categories", FR: "Catégories" },
  "Employees": { EN: "Employees", FR: "Employés" },
  "Sales": { EN: "Sales", FR: "Ventes" },
  "Stock": { EN: "Stock", FR: "Stock" },
  "Audit Log": { EN: "Audit Log", FR: "Journal d'Activités" },
  "Settings": { EN: "Settings", FR: "Paramètres" },
  "New Sale": { EN: "New Sale", FR: "Nouvelle Vente" },
  "My Sales": { EN: "My Sales", FR: "Mes Ventes" },

  // Actions
  "Add Product": { EN: "Add Product", FR: "Ajouter Produit" },
  "Create Employee": { EN: "Create Employee", FR: "Créer Employé" },
  "Search products...": { EN: "Search products...", FR: "Rechercher des produits..." },
  "Sign In": { EN: "Sign In", FR: "Se Connecter" },
  "Sign Out": { EN: "Sign Out", FR: "Se Déconnecter" },
  "Change Password": { EN: "Change Password", FR: "Changer Mot de Passe" },
  "Current Password": { EN: "Current Password", FR: "Mot de Passe Actuel" },
  "New Password": { EN: "New Password", FR: "Nouveau Mot de Passe" },
  "Confirm Password": { EN: "Confirm Password", FR: "Confirmer Mot de Passe" },
  "Language": { EN: "Language", FR: "Langue" },
  "Sell": { EN: "Sell", FR: "Vendre" },
  "Save": { EN: "Save", FR: "Enregistrer" },
  "Cancel": { EN: "Cancel", FR: "Annuler" },
  "Delete": { EN: "Delete", FR: "Supprimer" },
  "Edit": { EN: "Edit", FR: "Modifier" },
  "Create": { EN: "Create", FR: "Créer" },
  "Update": { EN: "Update", FR: "Mettre à Jour" },
  "Close": { EN: "Close", FR: "Fermer" },

  // KPIs
  "Today's Revenue": { EN: "Today's Revenue", FR: "Revenu du Jour" },
  "Total Sales": { EN: "Total Sales", FR: "Ventes Totales" },
  "Low Stock Alerts": { EN: "Low Stock Alerts", FR: "Alertes Stock" },
  "Active Employees": { EN: "Active Employees", FR: "Employés Actifs" },

  // Labels
  "Store": { EN: "Store", FR: "Magasin" },
  "Category": { EN: "Category", FR: "Catégorie" },
  "Price": { EN: "Price", FR: "Prix" },
  "Quantity": { EN: "Quantity", FR: "Quantité" },
  "Total": { EN: "Total", FR: "Total" },
  "Name": { EN: "Name", FR: "Nom" },
  "Email": { EN: "Email", FR: "Email" },
  "Phone": { EN: "Phone", FR: "Téléphone" },
  "Password": { EN: "Password", FR: "Mot de Passe" },
  "Status": { EN: "Status", FR: "Statut" },
  "Actions": { EN: "Actions", FR: "Actions" },
  "Date": { EN: "Date", FR: "Date" },
  "Employee": { EN: "Employee", FR: "Employé" },
  "Employee ID": { EN: "Employee ID", FR: "Matricule" },

  // Messages
  "Sale completed": { EN: "Sale completed successfully", FR: "Vente effectuée avec succès" },
  "Loading": { EN: "Loading...", FR: "Chargement..." },
  "No data": { EN: "No data available", FR: "Aucune donnée disponible" },
  "Error": { EN: "An error occurred", FR: "Une erreur est survenue" },
  "Success": { EN: "Success", FR: "Succès" },

  // Store names
  "Yaoundé": { EN: "Yaoundé", FR: "Yaoundé" },
  "Kribi": { EN: "Kribi", FR: "Kribi" },
  "All Stores": { EN: "All Stores", FR: "Tous les Magasins" },

  // Empty states
  "No products yet": { EN: "No products yet", FR: "Aucun produit encore" },
  "No sales recorded": { EN: "No sales recorded", FR: "Aucune vente enregistrée" },
  "No employees yet": { EN: "No employees yet", FR: "Aucun employé encore" },

  // Login
  "Welcome back": { EN: "Welcome back", FR: "Bienvenue" },
  "Enter credentials": { EN: "Enter your credentials to continue", FR: "Entrez vos identifiants pour continuer" },

  // Revenue chart
  "Revenue Overview": { EN: "Revenue Overview", FR: "Aperçu des Revenus" },
  "Sales by Store": { EN: "Sales by Store", FR: "Ventes par Magasin" },
  "Recent Sales": { EN: "Recent Sales", FR: "Ventes Récentes" },
  "Employee Performance": { EN: "Employee Performance", FR: "Performance des Employés" },

  // Password strength
  "Weak": { EN: "Weak", FR: "Faible" },
  "Medium": { EN: "Medium", FR: "Moyen" },
  "Strong": { EN: "Strong", FR: "Fort" },

  // Stock
  "In Stock": { EN: "In Stock", FR: "En Stock" },
  "Low": { EN: "Low", FR: "Faible" },
  "Out of Stock": { EN: "Out of Stock", FR: "Rupture de Stock" },

  // Cart
  "Cart": { EN: "Cart", FR: "Panier" },
  "Add to cart": { EN: "Add to cart", FR: "Ajouter au panier" },
  "Remove": { EN: "Remove", FR: "Retirer" },
  "Clear cart": { EN: "Clear cart", FR: "Vider le panier" },
  "Subtotal": { EN: "Subtotal", FR: "Sous-total" },

  // ── Category names (DB keys → translations) ──
  "Anklets": { EN: "Anklets", FR: "Bracelets de Cheville" },
  "Bags & Purses": { EN: "Bags & Purses", FR: "Sacs & Sacs à Main" },
  "Belts": { EN: "Belts", FR: "Ceintures" },
  "Body Jewelry": { EN: "Body Jewelry", FR: "Bijoux de Corps" },
  "Bracelets": { EN: "Bracelets", FR: "Bracelets" },
  "Brooches & Pins": { EN: "Brooches & Pins", FR: "Broches & Épingles" },
  "Cufflinks": { EN: "Cufflinks", FR: "Boutons de Manchette" },
  "Earrings": { EN: "Earrings", FR: "Boucles d'Oreilles" },
  "Glasses Frames": { EN: "Glasses Frames", FR: "Montures de Lunettes" },
  "Gloves": { EN: "Gloves", FR: "Gants" },
  "Hair Accessories": { EN: "Hair Accessories", FR: "Accessoires Cheveux" },
  "Hair Clips & Pins": { EN: "Hair Clips & Pins", FR: "Pinces & Épingles à Cheveux" },
  "Hats & Caps": { EN: "Hats & Caps", FR: "Chapeaux & Casquettes" },
  "Headbands & Tiaras": { EN: "Headbands & Tiaras", FR: "Bandeaux & Tiares" },
  "Jewellery Boxes": { EN: "Jewellery Boxes", FR: "Boîtes à Bijoux" },
  "Jewelry Sets": { EN: "Jewelry Sets", FR: "Parures de Bijoux" },
  "Keychains": { EN: "Keychains", FR: "Porte-clés" },
  "Luggage & Travel": { EN: "Luggage & Travel", FR: "Bagages & Voyage" },
  "Necklaces & Pendants": { EN: "Necklaces & Pendants", FR: "Colliers & Pendentifs" },
  "Perfume & Fragrance": { EN: "Perfume & Fragrance", FR: "Parfum & Fragrance" },
  "Phone Cases": { EN: "Phone Cases", FR: "Coques de Téléphone" },
  "Rings": { EN: "Rings", FR: "Bagues" },
  "Scarves & Wraps": { EN: "Scarves & Wraps", FR: "Écharpes & Châles" },
  "Shoe Accessories": { EN: "Shoe Accessories", FR: "Accessoires Chaussures" },
  "Socks & Stockings": { EN: "Socks & Stockings", FR: "Chaussettes & Bas" },
  "Sunglasses": { EN: "Sunglasses", FR: "Lunettes de Soleil" },
  "Sunglasses Cases": { EN: "Sunglasses Cases", FR: "Étuis à Lunettes" },
  "Ties & Bow Ties": { EN: "Ties & Bow Ties", FR: "Cravates & Nœuds Papillon" },
  "Umbrellas": { EN: "Umbrellas", FR: "Parapluies" },
  "Wallets & Card Holders": { EN: "Wallets & Card Holders", FR: "Portefeuilles & Porte-cartes" },
  "Watches": { EN: "Watches", FR: "Montres" },

  // ── New categories ──
  "Shoes & Sneakers": { EN: "Shoes & Sneakers", FR: "Chaussures & Baskets" },
  "Heels & Pumps": { EN: "Heels & Pumps", FR: "Talons & Escarpins" },
  "Boots & Ankle Boots": { EN: "Boots & Ankle Boots", FR: "Bottes & Bottines" },
  "Sandals & Flip-Flops": { EN: "Sandals & Flip-Flops", FR: "Sandales & Tongs" },
  "Bonnets & Beanies": { EN: "Bonnets & Beanies", FR: "Bonnets & Tuques" },
  "Backpacks": { EN: "Backpacks", FR: "Sacs à Dos" },
  "Clutches & Evening Bags": { EN: "Clutches & Evening Bags", FR: "Pochettes & Sacs de Soirée" },
  "Crossbody Bags": { EN: "Crossbody Bags", FR: "Sacs Bandoulière" },
  "Tote Bags": { EN: "Tote Bags", FR: "Cabas & Tote Bags" },
  "Makeup Bags & Pouches": { EN: "Makeup Bags & Pouches", FR: "Trousses à Maquillage" },
  "Hair Extensions & Wigs": { EN: "Hair Extensions & Wigs", FR: "Extensions & Perruques" },
  "Pocket Squares": { EN: "Pocket Squares", FR: "Pochettes de Costume" },
  "Suspenders": { EN: "Suspenders", FR: "Bretelles" },
  "Leg Warmers": { EN: "Leg Warmers", FR: "Jambières" },
  "Sports Accessories": { EN: "Sports Accessories", FR: "Accessoires de Sport" },
  "Baby Accessories": { EN: "Baby Accessories", FR: "Accessoires Bébé" },
  "Swim & Beach Accessories": { EN: "Swim & Beach Accessories", FR: "Accessoires Plage & Bain" },
  "Compact Mirrors": { EN: "Compact Mirrors", FR: "Miroirs de Poche" },
  "Coin Purses": { EN: "Coin Purses", FR: "Porte-Monnaie" },
  "Laptop Bags & Sleeves": { EN: "Laptop Bags & Sleeves", FR: "Sacoches & Housses PC" },
  "Face Masks & Veils": { EN: "Face Masks & Veils", FR: "Masques & Voiles" },
  "Arm Warmers": { EN: "Arm Warmers", FR: "Mitaines & Manchons" },
  "Jewelry Organizers": { EN: "Jewelry Organizers", FR: "Organiseurs à Bijoux" },
  "Shoe Care & Accessories": { EN: "Shoe Care & Accessories", FR: "Entretien & Accessoires Chaussures" },

  // ── Categories page ──
  "Manage categories subtitle": {
    EN: "Manage your accessories categories",
    FR: "Gérez vos catégories d'accessoires",
  },
  "Category name placeholder": {
    EN: "Category name...",
    FR: "Nom de la catégorie...",
  },
  "Search categories...": { EN: "Search categories...", FR: "Rechercher une catégorie..." },
  "No results for": { EN: "No results for", FR: "Aucun résultat pour" },
  "Clear search": { EN: "Clear search", FR: "Effacer la recherche" },
  "No categories yet": {
    EN: "No categories yet",
    FR: "Aucune catégorie",
  },
  "product singular": { EN: "product", FR: "produit" },
  "product plural": { EN: "products", FR: "produits" },
  "Delete confirm": {
    EN: 'Delete "{name}"?',
    FR: 'Supprimer "{name}" ?',
  },

  // ── Products page ──
  "All": { EN: "All", FR: "Toutes" },
  "Edit Product": { EN: "Edit Product", FR: "Modifier le Produit" },
  "New Product": { EN: "New Product", FR: "Nouveau Produit" },
  "Fill in details": {
    EN: "Fill in the details below",
    FR: "Remplissez les informations ci-dessous",
  },
  "Product Image": { EN: "Product Image", FR: "Image du Produit" },
  "Change image": { EN: "Change image", FR: "Changer l'image" },
  "Uploading": { EN: "Uploading...", FR: "Téléchargement..." },
  "Drag drop image": { EN: "Drag & drop an image", FR: "Glissez une image ici" },
  "Or click to browse": { EN: "or click to browse", FR: "ou cliquez pour parcourir" },
  "Accepted formats": { EN: "JPG, PNG, WEBP", FR: "JPG, PNG, WEBP" },
  "Product name placeholder": {
    EN: "Product name...",
    FR: "Nom du produit...",
  },
  "No categories create first": {
    EN: "No categories. Create one first.",
    FR: "Aucune catégorie. Créez-en d'abord.",
  },
  "Initial Stock": { EN: "Initial Stock", FR: "Stock initial" },
  "Click to add product": {
    EN: "Click Add Product to get started",
    FR: "Cliquez sur Ajouter Produit pour commencer",
  },
  "Delete product confirm": {
    EN: 'Delete "{name}"?',
    FR: 'Supprimer "{name}" ?',
  },

  // ── Settings page ──
  "Account Info": { EN: "Account Info", FR: "Informations du Compte" },
  "Account Info subtitle": { EN: "Your account details", FR: "Détails de votre compte" },
  "Change Password subtitle": { EN: "Update your account password", FR: "Modifier votre mot de passe" },
  "Passwords do not match": { EN: "Passwords do not match", FR: "Les mots de passe ne correspondent pas" },
  "Password too short": { EN: "Minimum 8 characters", FR: "Minimum 8 caractères" },
  "Password changed success": { EN: "Password updated successfully", FR: "Mot de passe mis à jour avec succès" },
  "Wrong current password": { EN: "Current password is incorrect", FR: "Mot de passe actuel incorrect" },
  "Role": { EN: "Role", FR: "Rôle" },

  // ── Colors / Variants ──
  "Colors": { EN: "Colors", FR: "Couleurs" },
  "Add Color": { EN: "Add Color", FR: "Ajouter une couleur" },
  "Color name": { EN: "Color name", FR: "Nom de la couleur" },
  "Color name placeholder": { EN: "e.g. Black, Rouge, Navy...", FR: "ex : Noir, Rouge, Marine..." },
  "Yaoundé Stock": { EN: "Yaoundé Qty", FR: "Qté Yaoundé" },
  "Kribi Stock": { EN: "Kribi Qty", FR: "Qté Kribi" },
  "No colors yet": { EN: "No colors added yet", FR: "Aucune couleur ajoutée" },
  "Save Color": { EN: "Save Color", FR: "Enregistrer" },
  "color singular": { EN: "color", FR: "couleur" },
  "color plural": { EN: "colors", FR: "couleurs" },
  "Delete color confirm": { EN: 'Remove color "{name}"?', FR: 'Retirer la couleur "{name}" ?' },
  "Has sales warning": {
    EN: "This product has sales history and cannot be deleted.",
    FR: "Ce produit a un historique de ventes et ne peut pas être supprimé.",
  },
  "Has products warning": {
    EN: 'Category "{name}" has {count} product(s). Reassign them before deleting.',
    FR: 'La catégorie "{name}" contient {count} produit(s). Réaffectez-les avant de supprimer.',
  },
};

function detectLang(): Lang {
  const stored = localStorage.getItem("gs_lang");
  if (stored === "EN" || stored === "FR") return stored;
  const preferred = [...(navigator.languages ?? [navigator.language])];
  return preferred.some((l) => l.toLowerCase().startsWith("fr")) ? "FR" : "EN";
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "EN",
  setLang: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  const setLang = useCallback((newLang: Lang) => {
    localStorage.setItem("gs_lang", newLang);
    setLangState(newLang);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      let str = translations[key]?.[lang] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(`{${k}}`, v);
        }
      }
      return str;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
