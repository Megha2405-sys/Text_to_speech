# Vox — Text to Speech

Vox turns typed or imported text into speech, with language and pace controls. It includes a browser app for Vercel and the original Windows desktop app. Speech is generated through Google Text-to-Speech, so audio generation requires an internet connection.

## Run the web app locally

Install Python 3.13, then from this folder run:

```bat
c:\python313\python.exe -m pip install -r requirements.txt
c:\python313\python.exe app.py
```

Open <http://127.0.0.1:5000> in your browser.

## Deploy the web app to Vercel

The Flask app is the Vercel entry point (`app.py`). Vercel detects Flask and installs dependencies from `requirements.txt`; `.python-version` selects Python 3.13.

### Deploy with the Vercel CLI

1. Create a free account at <https://vercel.com>.
2. Install Node.js if needed, then install the Vercel CLI:

   ```bat
   npm install --global vercel
   ```

3. In this project folder, sign in and deploy:

   ```bat
   vercel login
   vercel
   ```

4. For a production deployment, run:

   ```bat
   vercel --prod
   ```

Or push this folder to a GitHub repository, import that repository in the Vercel dashboard, and deploy. Vercel will build the Flask app automatically. No environment variables are required.

The deployed page creates speech through a Vercel Python Function. Each request is limited to 5,000 characters. Audio is generated on demand and returned to the browser; it is not stored on the server.

## Optional: Windows desktop app

```bat
c:\python313\python.exe dlt\Text-to-Speech.py
```

To package the desktop app, run `dlt\build.bat`. Its build output will be under `dlt\dist\Vox.exe`.
