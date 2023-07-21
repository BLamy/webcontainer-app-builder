import React from "react";
import ReactDOM from "react-dom/client";
import { WebContainer } from "@webcontainer/api";
import App from "./App";
import * as Diff from 'diff';

// Should probably be in a .d.ts file 
declare const __PACKAGE_CONTAINER_JSON__: string
declare global {
  interface Window {
    webcontainer: WebContainer
    webcontainerUrl: string; 
  }
}

// Currently only supports editing one page
let currentFileName = "/webcontainer/src/app/page.tsx";
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
  // TODO figure out how to find out if applying a patch fails
  // Have GPT reflect on it's mistake in the event of a mistake
  const newPage = Diff.applyPatch(page, patch);
  writeAppPage(newPage)
}

const root = ReactDOM.createRoot(document.getElementById("app"));
const renderApp = async () => {
  root.render(
    <App
      value={await readAppPage()}
      url={window.webcontainerUrl}
      overwriteFile={newCode => writeAppPage(newCode)}
      applyPatch={(patch) => applyPatch(patch)}
    />
  );
} 

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;
window.addEventListener("load", async () => {
  webcontainerInstance = await WebContainer.boot();
  window.webcontainer = webcontainerInstance;

  await webcontainerInstance.mount(__PACKAGE_CONTAINER_JSON__);

  // npm install
  console.log("installing node_modules");
  const installProcess = await webcontainerInstance.spawn("npm", ["install"]);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
      },
    })
  );
  await installProcess.exit;

  // 'npx create-next-app@13.4.9 --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm app'
  console.log("installing nextjs");
  const createNextAppProcess = await webcontainerInstance.spawn("npm", [
    "start",
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

