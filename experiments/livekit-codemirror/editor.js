import { javascript } from "@codemirror/lang-javascript";
import { basicSetup, EditorView } from "codemirror";
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { WebsocketProvider } from "y-websocket";

const documentId = "interviewly-yjs-experiment";
const ydoc = new Y.Doc();
const provider = new WebsocketProvider("wss://demos.yjs.dev/ws", documentId, ydoc);

const sharedCode = ydoc.getText("code");

provider.awareness.setLocalStateField("user", {
  name: `Participant ${Math.floor(Math.random() * 1000)}`,
  color: `hsl(${Math.floor(Math.random() * 360)} 75% 60%)`,
});

provider.on("sync", (isSynced) => {
  console.log(`Yjs synchronized: ${isSynced}`);

  if (isSynced && sharedCode.length === 0) {
    sharedCode.insert(
      0,
      `function findPair(numbers, target) {
  // Try solving the interview task here.
  return [];
}
`,
    );
  }
});

provider.on("status", ({ status }) => {
  console.log(`Yjs WebSocket: ${status}`);
});

const editorElement = document.querySelector("#editor");

if (!editorElement) {
  throw new Error("Editor element was not found");
}

new EditorView({
  extensions: [
    basicSetup,
    javascript(),
    EditorView.lineWrapping,
    yCollab(sharedCode, provider.awareness),
  ],
  parent: editorElement,
});

// Оставляем ссылки для диагностики эксперимента через DevTools.
Object.assign(window, {
  yjsExperiment: { ydoc, provider, sharedCode },
});
