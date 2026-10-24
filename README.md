# BOLD TOUCH — Atelier de Personnalisation

Next.js 14 (App Router) + Tailwind CSS + Framer Motion.

## Lancer le site

```bash
npm install
npm run dev
```

Le site tourne sur **http://localhost:4000**.

## Espace Administration

Accessible via le lien **Admin** dans le header (ou directement `/admin`).

- Mot de passe par défaut : `boldtouch2026`
- Pour le changer : copiez `.env.example` en `.env.local` et modifiez `ADMIN_PASSWORD`.

Depuis l'admin vous pouvez :
- Ajouter un nouveau produit (nom, prix, catégorie, couleurs, tailles, badge, description, photo).
- Modifier un produit existant (bouton crayon) : nom, prix, catégorie, couleurs, tailles, badge,
  description et photo.
- Supprimer un produit existant.
- **Approuver ou refuser les avis clients** (section "Avis clients") : chaque avis soumis sur le
  site passe par une modération avant d'apparaître sur la page d'accueil. Vous pouvez aussi
  supprimer un avis.
- Les changements apparaissent **immédiatement** sur la Boutique/Accueil, sans redémarrer le serveur.

Les produits sont stockés dans `data/products.json`, les avis dans `data/reviews.json`, et les
photos uploadées dans `public/uploads/`.

Le champ "Nom" / "Description" dans l'admin est en français uniquement : si une traduction anglaise
ou arabe existait déjà pour ce produit, elle est conservée automatiquement — seul le texte français
est modifié.

## Personnalisation client

En cliquant sur un produit, le client arrive sur sa page dédiée où il peut :
- Uploader sa propre photo et voir un **aperçu démo** de l'emplacement d'impression sur le produit
- Choisir une **couleur** et une **taille** (si applicable)
- Cliquer sur **"Envoyer ma demande"** — la demande (produit, couleur, taille, photo, message) est
  enregistrée et visible immédiatement dans l'admin, section "Demandes clients"
- Ou contacter directement via WhatsApp en un clic

Les photos clients sont stockées dans `public/uploads/customers/`, les demandes dans
`data/requests.json`.

## Avis clients

Sur la page d'accueil, une section "Avis de nos clients" affiche les avis **approuvés** sous
forme de cartes (nom, note en étoiles, commentaire). Un bouton "Laisser un avis" ouvre un petit
formulaire (nom, note, commentaire) ; l'avis soumis passe en statut "En attente" et n'apparaît
publiquement qu'une fois approuvé depuis l'admin.

## Langues (FR / EN / AR)

Un sélecteur de langue (FR / EN / AR) est disponible dans le header (et dans le menu mobile).
Le choix de langue est mémorisé dans le navigateur du client (localStorage) et s'applique à :
navigation, bannière, accueil, boutique, fiche produit, formulaire de personnalisation, avis et
pied de page. En arabe, la mise en page bascule automatiquement en RTL (de droite à gauche).

Les noms et descriptions des 22 produits existants sont déjà traduits en français, anglais et
arabe (`data/products.json`). L'espace **admin reste volontairement en français uniquement** pour
simplifier la saisie : un nouveau produit créé depuis l'admin n'a qu'une version française, ce qui
est normal — vous pouvez ajouter ses traductions manuellement dans `data/products.json` si besoin.

## Build production

```bash
npm run build
npm run start
```
