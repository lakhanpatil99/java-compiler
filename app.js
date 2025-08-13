const BACKEND_URL = "/run";

// Initialize Monaco Editor
require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs" } });
require(["vs/editor/editor.main"], function () {
  const savedCode = decodeURIComponent(new URLSearchParams(window.location.search).get("code") || "");
  window.editor = monaco.editor.create(document.getElementById("editor"), {
    value: savedCode || `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("Welcome to EngiProgramee!");
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        
        System.out.print("Enter your age: ");
        int age = scanner.nextInt();
        
        System.out.println("\\nHello, " + name + "!");
        System.out.println("You are " + age + " years old.");
    }
}`,
    language: "java",
    theme: "vs-dark",
    fontSize: 16,
    automaticLayout: true,
    minimap: { enabled: false }
  });
});

// Run Button Handler
document.getElementById("runBtn").addEventListener("click", async () => {
  const code = window.editor.getValue();
  const input = document.getElementById("inputBox").value;
  const runBtn = document.getElementById("runBtn");
  const outputElement = document.getElementById("outputText");
  
  runBtn.disabled = true;
  runBtn.innerHTML = "⏳ Running...";
  outputElement.textContent = "Compiling and running your code...";

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, input })
    });
    
    const data = await res.json();
    if (data.error) {
      outputElement.textContent = `❌ Error:\n${data.error}\n${data.details || ''}`;
    } else {
      outputElement.textContent = data.output || "Program executed successfully (no output)";
    }
  } catch (err) {
    outputElement.textContent = `🚨 Network Error: ${err.message}`;
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = "▶ Run";
  }
});

// Clear Button Handler
document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("outputText").textContent = "Output cleared";
  document.getElementById("inputBox").value = "";
});

// Share Button Handler
document.getElementById("shareBtn").addEventListener("click", () => {
  const code = encodeURIComponent(window.editor.getValue());
  const shareURL = `${window.location.origin}${window.location.pathname}?code=${code}`;
  
  navigator.clipboard.writeText(shareURL).then(() => {
    const shareBtn = document.getElementById("shareBtn");
    const originalText = shareBtn.innerHTML;
    shareBtn.innerHTML = "✓ Copied!";
    
    setTimeout(() => {
      shareBtn.innerHTML = originalText;
    }, 2000);
  }).catch(() => {
    alert("Could not copy share link. Please copy it manually from the address bar.");
  });
});