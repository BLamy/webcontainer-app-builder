import React from "react";
import Editor from "@monaco-editor/react";
import Chat from "./Chat";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  // TODO figure out vite env
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

export function App({ value, onChange, url, applyPatch }) {
  const iframeRef = React.useRef();
  const [messages, setMessages] = React.useState([
    // { role: "system", content: "Generate a valid patchset that can be applied with git apply based on the users code and requirements. Use tailwindcss instead of inline styles. Do not include anything else except for a valid patchset in a code block marked as diff" },
    {
      role: "system",
      content:
        "Generate a valid react component using nextjs and tailwindcss based on the users code and requirements.  Do not include anything else except for valid typescript in a code block marked as tsx",
    },
  ]);
  const [userHadEditedCode, setUserHadEditedCode] = React.useState(true);
  const [isChatVisible, setIsChatVisible] = React.useState(true);
  const [isCodeVisible, setIsCodeVisible] = React.useState(false);
  const [isWebPreviewVisible, setIsWebPreviewVisible] = React.useState(false);
  const [isPhonePreviewVisible, setIsPhonePreviewVisible] =
    React.useState(true);
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      openai
        .createChatCompletion({
          // model: "gpt-3.5-turbo",
          model: "gpt-3.5-turbo-16k",
          // model: "gpt-4",
          messages,
          temperature: 1,
          // max_tokens: 4000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        })
        .then((response) => {
          console.log(response.data.choices[0].message);
          setMessages([...messages, response.data.choices[0].message]);
        });
    } else if (lastMessage.role === "assistant") {
      console.log("assistant message");
      const regex = /```(.*)\n([\s\S]*?)\n```/g;
      let match;
      // debugger
      while ((match = regex.exec(lastMessage.content)) !== null) {
        console.log("looping");
        if (
          match[1] === "ts" ||
          match[1] === "tsx" ||
          match[1] === "typescript"
        ) {
          applyPatch(`"use client"\n${match[2]}`).then(() => {
            //.then(() => setMessages([...messages, { role: "system", content: "patch applied"}]))
            setTimeout(() => {
              setMessages([
                ...messages,
                { role: "system", content: "codes updated" },
              ]);

              // hack around a weird refresh bug
              iframeRef.current.src = url;
            }, 10);
          });
          return;
        }
      }
    }
  }, [messages]);
  return (
    <div>
      <div className="text-center">
        <div className="join">
          <button
            className={`btn  join-item ${isChatVisible ? "btn-primary" : ""}`}
            onClick={() => setIsChatVisible(!isChatVisible)}
          >
            Chat
          </button>
          <button
            className={`btn  join-item ${isCodeVisible ? "btn-primary" : ""}`}
            onClick={() => setIsCodeVisible(!isCodeVisible)}
          >
            Code
          </button>
          <button
            className={`btn  join-item ${
              isWebPreviewVisible ? "btn-primary" : ""
            }`}
            onClick={() => setIsWebPreviewVisible(!isWebPreviewVisible)}
          >
            Web Preview
          </button>
          <button
            className={`btn  join-item ${
              isPhonePreviewVisible ? "btn-primary" : ""
            }`}
            onClick={() => setIsPhonePreviewVisible(!isPhonePreviewVisible)}
          >
            Phone Preview
          </button>
        </div>
      </div>
      <div className="flex h-screen">
        {isChatVisible && (
          <Chat
            messages={messages.filter(Boolean)}
            onMessageSend={(msg) => {
              if (messages.length === 1) {
                setMessages([
                  ...messages,
                  {
                    role: "user",
                    content:
                      "Requirements:\n" +
                      msg +
                      "\nCode:\n```\ntsx\n" +
                      value +
                      "\n```",
                  },
                ]);
                setUserHadEditedCode(false);
              } else if (userHadEditedCode) {
                setMessages([
                  ...messages,
                  {
                    role: "system",
                    content:
                      "user has manually updated code please use this new updated code instead of previous messages",
                  },
                  {
                    role: "user",
                    content:
                      "Requirements:\n" +
                      msg +
                      "\nCode:\n```\ntsx\n" +
                      value +
                      "\n```",
                  },
                ]);
                setUserHadEditedCode(false);
              } else {
                setMessages([...messages, { role: "user", content: msg }]);
              }
            }}
          />
        )}
        {isCodeVisible && (
          <div
            className="bg-white overflow-auto"
            id="editor"
            style={{ width: "50%" }}
          >
            <Editor
              className="w-full h-full"
              defaultLanguage="javascript"
              value={value}
              theme="vs-dark"
              onChange={async (e) => {
                await onChange(e);
                setUserHadEditedCode(true);
                setTimeout(() => {
                  // hack around a weird refresh bug
                  iframeRef.current.src = url;
                }, 10);
              }}
            />
          </div>
        )}

        {isPhonePreviewVisible && (
          <div
            className="bg-white overflow-auto"
            id="preview"
            style={{ width: "50%" }}
          >
            <div className="mockup-phone">
              <div className="camera"></div>
              <div className="display">
                <div className="artboard artboard-demo phone-1">
                  <iframe
                    ref={iframeRef}
                    src={url}
                    className="w-full h-full"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
