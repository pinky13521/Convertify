# Návod na nasazení Convertify na Lenovo server

Tento projekt je připraven pro okamžité a bezproblémové spuštění na vašem Lenovo PC / serveru v lokální síti. Všechny potřebné knihovny a fonty jsou nyní uloženy **lokálně ve složce `libs/`**, takže program funguje 100% spolehlivě i offline a bez závislosti na cizích serverech.

---

## 1. Jak přenést soubory na Lenovo PC

Vyberte si jeden z následujících způsobů:

- **Přes Flash disk / Síťové sdílení:** Zkopírujte celou složku `Convert` na flash disk a vložte do Lenovo PC.
- **Přes SCP / SSH (pokud máte na Lenovo Linux):**
  ```bash
  scp -r /Users/ondrejpinkas/Documents/Projekty/Convert uzivatel@IP_LENOVO:~/convertify
  ```
- **Přes ZIP archiv:** Zabalte složku do `Convert.zip` a pošlete si ji / přeneste na server a rozbalte.

---

## 2. Možnosti spuštění na Lenovo PC

Vyberte si variantu podle toho, jaký operační systém na svém Lenovo serveru máte:

### Varianta A: Pomocí Dockeru (nejčistší a nejspolehlivější pro server)
Funguje na Linuxu i Windows s Dockerem. Běží na pozadí, automaticky se restartuje po výpadku napájení.

```bash
cd Convert
docker compose up -d
```
Aplikace ihned běží na portu `8080`.

---

### Varianta B: Pomocí Pythonu 3 (žádné instalace, stačí standardní systém)
Na Linuxu bývá Python 3 předinstalovaný, na Windows stačí mít nainstalovaný Python.

- **Linux / macOS:**
  ```bash
  cd Convert
  python3 server.py
  # Nebo spustit skript:
  ./start.sh
  ```
- **Windows:**
  - Stačí 2× kliknout na soubor `start.bat` (nebo spustit `python server.py`).

---

### Varianta C: Pomocí Node.js
Pokud máte na serveru nainstalovaný Node.js:
```bash
cd Convert
node server.js
```

---

### Varianta D: Klasický Nginx (jako systémová služba na Linuxu)
Pokud už na svém Lenovo PC provozujete Nginx:
1. Zkopírujte obsah složky do `/var/www/convertify`:
   ```bash
   sudo mkdir -p /var/www/convertify
   sudo cp -r * /var/www/convertify/
   ```
2. Použijte přiloženou konfiguraci `nginx.conf`:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/convertify
   sudo ln -s /etc/nginx/sites-available/convertify /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

---

### Varianta E: Běh na pozadí jako služba systému (Systemd na Linuxu)
Pokud chcete, aby se server spustil automaticky po zapnutí Lenovo PC bez Dockeru:
```bash
sudo cp convertify.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now convertify
```

---

## 3. Jak se k programu připojit z ostatních PC / telefonů v síti

1. Zjistěte IP adresu svého Lenovo serveru:
   - Na Linuxu v terminálu: `ip a` nebo `hostname -I`
   - Na Windows v příkazovém řádku: `ipconfig` (hledejte *IPv4 Address*, např. `192.168.1.150`).
2. Na jakémkoliv jiném počítači, notebooku nebo mobilu připojeném ke stejné Wi-Fi / síti otevřete webový prohlížeč a zadejte:
   ```
   http://IP_VASEHO_LENOVO:8080
   ```
   *(Příklad: `http://192.168.1.150:8080`)*

Convertify bude ihned k dispozici pro celou vaši domácí nebo firemní síť!

---

## 4. Ochrana při častém vypínání a zapínání serveru

Pokud Lenovo server často vypínáte a zapínáte (nebo dochází k výpadkům napájení), aplikace má implementováno 5 úrovní ochrany:

1. **Aplikace funguje i když je server vypnutý (PWA Service Worker):**
   - Jakmile se kdokoliv na aplikaci jednou připojí z mobilu nebo notebooku, prohlížeč si automaticky uloží celou aplikaci do mezipaměti (`sw.js`).
   - I když Lenovo server kompletně vypnete nebo se zrovna restartuje, uživatel může stránku otevřít, převádět dokumenty i stahovat soubory (vše běží přímo v prohlížeči).
   - V záhlaví aplikace je malá kontrolka, která přehledně hlásí `Server připojen` nebo `Server se restartuje (převod stále funguje)`.

2. **Ochrana proti blokaci portu (`SO_REUSEADDR` a retry cyklus):**
   - V souboru `server.py` je aktivováno okamžité uvolnění portu 8080 a 10sekundový záchranný cyklus, takže po náhlém restartu nikdy nenastane chyba `Address already in use`.

3. **Automatický náběh po zapnutí Windows (Lenovo PC):**
   - Spusťte dávkový soubor `install-windows-autostart.bat`.
   - Vytvoří se tichý spouštěč (`run_silent.vbs`), který spustí server ihned po zapnutí Windows bez jakéhokoliv vyskakujícího černého okna konzole.

4. **Automatický náběh po zapnutí Linuxu (Lenovo PC):**
   - Pokud používáte Docker, `docker compose up -d` má nastaveno `restart: always` a naběhne sám.
   - Pokud používáte Python/systemd, stačí aktivovat službu: `sudo systemctl enable --now convertify`.

5. **Tip pro Lenovo hardware (automatické zapnutí při zapojení do zásuvky):**
   - V BIOSu/UEFI Lenovo (stiskněte `F1` nebo `Enter` při startu PC) přejděte do nabídky **Power** -> **After Power Loss** a zvolte **Power On**.
   - Počítač se tak sám automaticky zapne, kdykoliv dostane proud, aniž byste museli mačkat tlačítko napájení.

