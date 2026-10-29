# Convertify 🚀

> **Rychlý, moderní a bezpečný převodník dokumentů a obrázků běžící zcela offline a v lokální síti.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](#1-pomocí-dockeru-doporučeno)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)](#2-pomocí-pythonu)
[![Node.js](https://img.shields.io/badge/Node.js-Ready-339933?logo=nodedotjs&logoColor=white)](#3-pomocí-nodejs)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-success)](#klíčové-vlastnosti)

---

## 📋 Přehled

**Convertify** je webová aplikace pro konverzi dokumentů, tabulek a obrázků navržená s důrazem na **soukromí a nezávislost**. Všechny převody probíhají přímo v prohlížeči nebo na vašem vlastním lokálním serveru. Vaše citlivá data a soubory nikdy neopouštějí vaše zařízení a nejsou odesílány na žádné cizí cloudové servery.

Všechny externí knihovny (PDF.js, jsPDF, Mammoth, SheetJS/XLSX, JSZip) a fonty jsou uloženy lokálně ve složce `libs/`, takže Convertify funguje **100% offline**.

---

## ✨ Klíčové vlastnosti

- 🔒 **100% Soukromí:** Soubory se zpracovávají lokálně na klientovi nebo vlastním serveru.
- ⚡ **Bleskový převod:** Přetahování souborů systémem Drag & Drop.
- 📴 **Plně offline:** Žádné závislosti na externích CDN sítích.
- 📱 **Moderní responzivní design:** Vyladěné UI s historií převodů, podporou PWA (`sw.js`) a tmavým motivem.
- 🖥️ **Připraveno pro domácí i firemní server:** Snadné nasazení přes Docker, Python, Node.js nebo Nginx.

---

## 🔄 Podporované převody

| Vstupní formát | Možné cílové formáty |
| :--- | :--- |
| **Obrázky (JPG, PNG, WEBP)** | PNG, JPG/JPEG, WEBP, PDF, komprese |
| **PDF** | Extrakce textu (TXT), převod stránek na obrázky (JPG, PNG) |
| **Word (.docx)** | TXT, HTML |
| **Excel (.xlsx, .xls)** | HTML, TXT / CSV |
| **Markdown (.md)** | HTML, PDF, TXT |
| **Text (.txt)** | PDF, HTML |

---

## 🚀 Možnosti spuštění

Convertify lze spustit ihned několika způsoby:

### 1. Pomocí Dockeru (doporučeno)
Nejčistší varianta pro servery (Linux/Windows/macOS) s automatickým restartem:

```bash
docker compose up -d
```
Aplikace poběží na adrese **`http://localhost:8080`**.

---

### 2. Pomocí Pythonu
Nevyžaduje žádné dodatečné knihovny (využívá vestavěný `http.server` s podporou správných MIME typů):

- **Linux / macOS:**
  ```bash
  python3 server.py
  # nebo
  ./start.sh
  ```
- **Windows:**
  - Dvakrát klikněte na `start.bat` (nebo v terminálu: `python server.py`).

---

### 3. Pomocí Node.js
Pokud máte nainstalovaný Node.js (bez nutnosti instalovat npm balíčky):

```bash
node server.js
```

---

### 4. Jako systémová služba (Linux Systemd)
Pro trvalý běh na pozadí a automatický start po spuštění systému:

```bash
sudo cp convertify.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now convertify
```

Více informací o pokročilém nasazení naleznete v [README_DEPLOY.md](README_DEPLOY.md).

---

## 🌐 Přístup v lokální síti

Chcete-li Convertify používat z mobilu, tabletu nebo jiných počítačů v domácí či firemní síti:

1. Zjistěte lokální IP adresu serveru:
   - **Linux:** `hostname -I` nebo `ip a`
   - **Windows:** `ipconfig` (IPv4 Address)
   - **macOS:** `ipconfig getifaddr en0` (případně `en1`)
2. V prohlížeči na libovolném zařízení v síti otevřete:
   ```
   http://<IP-ADRESA-SERVERU>:8080
   ```

---

## 📁 Struktura projektu

```text
├── index.html            # Hlavní rozhraní aplikace
├── styles.css            # Moderní CSS styly a animace
├── app.js                # Klientská logika konverzí a obsluha UI
├── sw.js                 # Service Worker pro offline podporu (PWA)
├── libs/                 # Lokální knihovny a fonty (PDF.js, jsPDF, XLSX...)
├── server.py             # Lehký Python HTTP server
├── server.js             # Alternativní Node.js HTTP server
├── Dockerfile            # Kontejnerová definice
├── docker-compose.yml    # Docker Compose konfigurace
├── nginx.conf            # Vzorová konfigurace pro Nginx
├── convertify.service    # Systemd služba pro Linux
├── README.md             # Tento dokument
└── README_DEPLOY.md      # Podrobný průvodce nasazením na server
```

---

## 📄 Licence

Tento projekt je poskytován pod licencí [MIT](LICENSE).
