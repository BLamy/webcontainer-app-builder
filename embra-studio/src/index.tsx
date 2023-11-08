import React from "react";
import ReactDOM from "react-dom/client";
import { WebContainer, FileSystemTree } from "@webcontainer/api";
import App from "./App";
import * as Diff from 'diff';

declare global {
 interface Window {
   webcontainer: WebContainer
   webcontainerUrl: string; 
 }
}
const NEXTJS_TEMPLATE_REPO = 'BLamy/stackblitz-starters-nextjs-13.4.10';
const ROOT_FILE_NAME = `app/page.tsx`

let currentFileName = `${ROOT_FILE_NAME}`;

async function fetchFileContent(url: string): Promise<string> {
 const response = await fetch(url);
 const data = await response.json();
 return atob(data.content);
}

async function recursivelyFetchGithubLink(url: string): Promise<FileSystemTree> {
  const response = await fetch(url);
  const data = await response.json();
  const parsedData: FileSystemTree = {};
  for (let item of data) {
  if (item.type === 'file') {
    const content = await fetchFileContent(item.git_url);
    parsedData[item.name] = {
      file: {
        contents: content.toString()
      }
    };
  } else if (item.type === 'dir') {
    const children = await recursivelyFetchGithubLink(item.url);
    parsedData[item.name] = {
      directory: children
    };
  }
  }
  return parsedData;
 } 

async function cloneRepo(url: string) {
 const [owner, repo] = url.split('/');
 return recursivelyFetchGithubLink(`https://api.github.com/repos/${owner}/${repo}/contents`);
}

async function writeAppPage(content) {
 await webcontainerInstance.fs.writeFile(currentFileName, content, "utf-8");
 renderApp()
}

async function readAppPage() {
 return (
   await webcontainerInstance.fs.readFile(currentFileName, "utf-8")
 ).toString();
}

async function applyPatch(patch) {
 const page = await readAppPage();
 const newPage = Diff.applyPatch(page, patch);
 writeAppPage(newPage)
}

const root = ReactDOM.createRoot(document.getElementById("app"));
const renderApp = async () => {
  console.log('rendering', window.webcontainerUrl)
 root.render(
   <App
     value={await readAppPage()}
     url={window.webcontainerUrl}
     overwriteFile={newCode => writeAppPage(newCode)}
     applyPatch={(patch) => applyPatch(patch)}
   />
 );
} 

let webcontainerInstance: WebContainer;
window.addEventListener("load", async () => {
 webcontainerInstance = await WebContainer.boot();
 window.webcontainer = webcontainerInstance;
 const data = await cloneRepo(NEXTJS_TEMPLATE_REPO);
 console.log(JSON.stringify(data))
 await webcontainerInstance.mount(data);

 console.log("installing node_modules");
 const installProcess = await webcontainerInstance.spawn("npm", ["install", "--force"]);
 installProcess.output.pipeTo(
   new WritableStream({
     write(data) {
       console.log(data);
     },
   })
 );
 await installProcess.exit;

 console.log("installing nextjs");
 const createNextAppProcess = await webcontainerInstance.spawn("npm", [
   "run", "dev",
 ]);
 createNextAppProcess.output.pipeTo(
   new WritableStream({
     write(data) {
        console.log(data);
      },
    })
  );

  // Set url of iframe
  webcontainerInstance.on("server-ready", async (port, url) => {
    console.log("NextJS App Started: ", url);
    window.webcontainerUrl = url;
    renderApp();
  });
  await createNextAppProcess.exit;
});

