import path from "node:path"
import { fileURLToPath } from "node:url"
import { includeIgnoreFile } from "@eslint/compat"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, ".gitignore")
const config = [
  includeIgnoreFile(gitignorePath),
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js"],

    // any additional configuration for these file types here
  },
]
export default config
