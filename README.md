# QR_Phishing


# Download the demo below:

https://github.com/mohamed-wadi/APP_FR/releases/download/v1.0.0/FAKE-WEBSITE.mp4


# Watch the demo below:

https://github.com/user-attachments/assets/1d3f4dec-01c8-422b-ba4a-743667ab50c7

## Commandes de Déploiement et d'Exécution

```bash
# 1. Connexion SSH
ssh -i "glpi-key.pem.pem" ubuntu@ec2-52-201-238-158.compute-1.amazonaws.com

# 2. Aller dans le projet
cd ~/APP_FR

# 3. Mettre à jour si besoin
git pull origin main

# 4. Lancer le serveur avec PM2
pm2 start server.js --name qr-demo

# 5. (Optionnel) Sauvegarder PM2 pour auto-redémarrage
pm2 save

# 6. Lancer ngrok
./ngrok http 3000

# 7. Récupérer l'URL ngrok
#    → https://multisulcate-meghan-seasonedly.ngrok-free.dev

# 8. Dashboard
#    → https://multisulcate-meghan-seasonedly.ngrok-free.dev/dashboard
```

## Générer et Afficher le QR Code

```bash
python -c "import qrcode; qrcode.make('https://multisulcate-meghan-seasonedly.ngrok-free.dev').save('qr_presentation6.png')"

xdg-open ~/qr_presentation6.png
```
