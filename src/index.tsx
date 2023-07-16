import React from "react";
import ReactDOM from "react-dom/client";
import { WebContainer } from "@webcontainer/api";
import App from "./App";
declare global {
  interface Window {
    webcontainer: WebContainer
    webcontainerUrl: string; 
  }
}

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

const root = ReactDOM.createRoot(document.getElementById("app"));
const renderApp = async () => {
  const page = await readAppPage();

    root.render(
      <App
        value={page}
        url={window.webcontainerUrl}
        onChange={(text) => writeAppPage(text)}
        applyPatch={(patch) => writeAppPage(patch)}
      />
    );
} 

// TODO figure out how to get patches working
async function applyPatch(patch) {
  debugger
  console.log('applyPatch', patch)
  const patchPath = "/webcontainer/patchy.patch";
  console.log('writting file')
  console.log(await webcontainerInstance.fs.writeFile(patchPath, patch, "utf-8"));
  console.log('applying patch')

  const gitApplyProcess = await webcontainerInstance.spawn("git", ["apply", patchPath ]);
  gitApplyProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
      },
    })
  );
  await gitApplyProcess.exit;

  console.log('patch applied')
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

