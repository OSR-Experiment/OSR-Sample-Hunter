# Sample Hunter

Mini-site partageable pour rechercher des vidéos YouTube obscures selon une requête, un nombre de résultats, un nombre maximal de vues et une durée.

## Mise en ligne

1. Créer un projet Vercel et importer ce dossier.
2. Ajouter la variable d'environnement `YOUTUBE_API_KEY`.
3. Activer **YouTube Data API v3** dans Google Cloud.
4. Déployer.

Le site affiche les résultats et renvoie vers les vidéos originales. Il ne contourne pas les mécanismes de téléchargement de YouTube : n'utilisez le téléchargement/réemploi audio que lorsque vous avez l'autorisation nécessaire.

## Idée V2

Ajouter un score de "sample potential", plusieurs recherches générées automatiquement à partir d'une requête libre, favoris et export CSV.
