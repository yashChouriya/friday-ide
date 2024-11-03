import { useState, useRef, useEffect } from "react";
import {
  FolderPlus,
  FilePlus,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Send,
  FilePlus2,
} from "lucide-react";
import * as monaco from "monaco-editor";
import "./App.css";

interface File {
  name: string;
  content: string;
  type: "file";
  language?: string;
}

interface Folder {
  name: string;
  type: "folder";
  children: (File | Folder)[];
}

function App() {
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isFridayOpen, setIsFridayOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  // Monaco Editor refs and state
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement>(null);

  // Initialize Monaco Editor
  useEffect(() => {
    if (monacoEl.current) {
      if (!editorRef.current) {
        editorRef.current = monaco.editor.create(monacoEl.current, {
          value: selectedFile?.content || "",
          language: selectedFile?.language || "plaintext",
          theme: "vs-dark",
          automaticLayout: true,
          minimap: {
            enabled: true,
          },
          fontSize: 14,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 10,
          bracketPairColorization: {
            enabled: true,
          },
        });

        // Add event listener for content changes
        editorRef.current.onDidChangeModelContent(() => {
          if (selectedFile) {
            const newContent = editorRef.current?.getValue() || "";
            setSelectedFile({ ...selectedFile, content: newContent });
          }
        });
      }
    }

    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  // Update editor content when selected file changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(selectedFile?.content || "");
      monaco.editor.setModelLanguage(
        editorRef.current.getModel()!,
        selectedFile?.language || "plaintext"
      );
    }
  }, [selectedFile]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      editorRef.current?.layout();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-300 rounded">
      {/* File Explorer Section */}
      <div
        className={`relative ${
          isFileExplorerOpen ? "w-1/5" : "w-12"
        } border-r border-gray-700 transition-all duration-300 !bg-gray-950`}
      >
        <button
          onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
          className="absolute -right-3 top-2 z-10 bg-gray-800 rounded-full p-1"
        >
          {isFileExplorerOpen ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>

        <div className="p-4">
          {isFileExplorerOpen && (
            <>
              <div className="flex space-x-4 mb-4">
                <FilePlus2 size={20} className="cursor-pointer" />
                <FolderPlus size={20} className="cursor-pointer" />
                <FolderOpen size={20} className="cursor-pointer" />
              </div>
              <div className="border-t border-gray-700 pt-4 bg-blue-950 min-h-svh rounded">
                {/* File tree would go here */}
                <div className="text-sm text-center m-auto">No files open</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Code Editor Section */}
      <div className="flex-1 min-w-[50%]">
        {selectedFile ? (
          <div
            ref={monacoEl}
            className="h-full w-full"
            style={{
              minHeight: "100%",
              minWidth: "100%",
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-xl mb-2">No file is open</p>
              <p className="text-sm">
                Open a file from the explorer or create a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Friday AI Assistant Section */}
      <div
        className={`relative ${
          isFridayOpen ? "w-1/3" : "w-12"
        } border-l border-gray-700 transition-all duration-300 !bg-gray-950`}
      >
        <button
          onClick={() => setIsFridayOpen(!isFridayOpen)}
          className="absolute -left-3 top-2 z-10 bg-gray-800 rounded-full p-1"
        >
          {isFridayOpen ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>

        {isFridayOpen && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Friday AI Assistant</h2>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-900 ml-8"
                      : "bg-gray-800 mr-8"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask Friday anything..."
                  className="flex-1 bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (chatMessage.trim()) {
                      setChatHistory([
                        ...chatHistory,
                        { role: "user", content: chatMessage },
                      ]);
                      setChatMessage("");
                      // Here you would typically call your AI service
                    }
                  }}
                  className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
