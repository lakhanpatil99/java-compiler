import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/run", (req, res) => {
  const { code, input } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  const tempId = uuidv4();
  const javaFile = `temp_${tempId}.java`;
  const className = `Main_${tempId}`;

  try {
    // Modify code to use the correct class name
    const modifiedCode = code.replace(/class\s+Main/, `class ${className}`);
    fs.writeFileSync(javaFile, modifiedCode);

    // Compile Java
    exec(`javac ${javaFile}`, (compileErr, _, compileStderr) => {
      if (compileErr) {
        cleanupFiles();
        return res.status(400).json({ 
          error: "Compilation failed",
          details: compileStderr.toString()
        });
      }

      // Run Java with timeout (5 seconds)
      const runProcess = exec(
        `java ${className}`,
        { timeout: 5000 },
        (runErr, stdout, stderr) => {
          cleanupFiles();
          if (runErr) {
            return res.status(400).json({ 
              error: "Execution failed",
              details: stderr.toString() || runErr.message
            });
          }
          res.json({ output: stdout.toString() });
        }
      );

      // Pipe input to the process if provided
      if (input) {
        runProcess.stdin.write(input + "\n");
        runProcess.stdin.end();
      }

      // Handle process timeout
      runProcess.on('timeout', () => {
        runProcess.kill();
        cleanupFiles();
        res.status(400).json({ 
          error: "Execution timed out (5s limit)" 
        });
      });
    });

    function cleanupFiles() {
      try { fs.unlinkSync(javaFile); } catch {}
      try { fs.unlinkSync(`${className}.class`); } catch {}
    }

  } catch (err) {
    cleanupFiles();
    res.status(500).json({ 
      error: "Server error",
      details: err.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});