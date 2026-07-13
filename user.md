# First-Time User Guide

This file is for a first-time user who wants to run this system on their own Windows PC.

## Prerequisites
Before you start, make sure your computer has the following installed:

- Windows 10 or Windows 11
- Git: version 2.40 or newer
  - Download: https://git-scm.com/download/win
- Docker Desktop: latest stable version
  - Download: https://www.docker.com/products/docker-desktop/
- Python: version 3.10 or 3.11
  - Download: https://www.python.org/downloads/windows/
- VS Code (recommended): latest version
  - Download: https://code.visualstudio.com/

Important:
- Docker Desktop must be running before you run the project.
- If you use Windows, PowerShell is the recommended terminal.

## 1. Which terminal to use
For Windows, the easiest choice is PowerShell.

Recommended:
- Open VS Code
- Go to Terminal > New Terminal
- Make sure it uses PowerShell

You can also use Command Prompt (cmd), but PowerShell is recommended for this project.

## 2. Clone the project
In PowerShell, run:

```powershell
git clone https://github.com/starlite20/vividstudio.git
```

This creates a folder named vividstudio in your current location.

## 3. Go to the project folder
Run:

```powershell
cd vividstudio
```

## 4. Create the input and output folders
Run:

```powershell
mkdir input, output -Force
```

This creates the folders where the system reads tasks from and writes results to.

## 5. Copy a sample task file
Run:

```powershell
copy examples\tasks.sample.json input\tasks.json
```

This gives the system a sample input file to process.

## 6. Build the Docker image
Run:

```powershell
docker build -t video-caption-agent:local .
```

This may take a few minutes the first time.

## 7. Run the system
Run:

```powershell
docker run --rm `
  -v "${PWD}\input:/input" `
  -v "${PWD}\output:/output" `
  video-caption-agent:local
```

This tells Docker to:
- read tasks from the input folder
- write results to the output folder

## 8. See the output
After the run finishes, open the result file:

```powershell
Get-Content .\output\results.json
```

You should see the generated captions in JSON format.

## 9. Run the front end (optional)
If you want to use the browser-based front end, you can start the web server and open the interface.

### 9.1 Start the web server
In PowerShell, run:

```powershell
PYTHONPATH=src python -m video_caption_agent.server
```

This starts the local web app server.

### 9.2 Open the front end
Open your browser and go to:

```text
http://localhost:8000
```

If the front end files are served separately, you can also open the folder [frontend](frontend) directly in a browser.

### 9.3 Optional: use the static demo frontend
If you want to use the demo pages in the repository, open the folder [frontend](frontend) and run the app from there if needed.

## 10. Important notes
- Make sure Docker Desktop is installed and running before you start.
- If you do not have a real API key, the system can still run in fallback mode and create output.
- If you want to use the system with a real model, you will need to set the required environment variables.

## 11. If you prefer Command Prompt (cmd)
If you use cmd instead of PowerShell, use these commands:

```cmd
git clone https://github.com/starlite20/vividstudio.git
cd vividstudio
mkdir input output
copy examples\tasks.sample.json input\tasks.json
docker build -t video-caption-agent:local .
docker run --rm -v "%cd%\input:/input" -v "%cd%\output:/output" video-caption-agent:local
type output\results.json
```

## 12. Simple summary
For a beginner, the easiest path is:

1. Open PowerShell
2. Run git clone https://github.com/starlite20/vividstudio.git
3. Run cd vividstudio
4. Run the commands above
5. Wait for Docker to finish
6. Check the result in output\results.json
7. Optionally start the web server and open http://localhost:8000
